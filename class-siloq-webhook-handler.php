<?php

class Siloq_Webhook_Handler {
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('siloq/v1', '/webhook', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_webhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle_webhook(WP_REST_Request $request) {
        $payload     = $request->get_json_params();
        $event_type  = $payload['event_type'] ?? '';
        $data        = $payload['data'] ?? [];
        $incoming_id = (string)($payload['site_id'] ?? '');
        $local_id    = (string)get_option('siloq_site_id', '');

        // Basic auth: site_id must match what's configured in the plugin
        if ($local_id && $incoming_id !== $local_id) {
            return new WP_REST_Response(['success' => false, 'error' => 'site_id_mismatch'], 401);
        }

        switch ($event_type) {
            case 'content.apply_content':
                return $this->apply_content($data);
            case 'meta.update':
                return $this->update_meta($data);
            case 'page.create_draft':
                return $this->create_draft($data);
            default:
                return new WP_REST_Response(['success' => false, 'error' => 'unknown_event'], 400);
        }
    }

    private function apply_content($data) {
        // Find post by URL, apply before→after content replacement
        $url   = $data['url'] ?? '';
        $field = $data['field'] ?? 'content_body';
        $after = $data['after'] ?? '';

        $post_id = url_to_postid($url);
        if (!$post_id) {
            return new WP_REST_Response(['success' => false, 'error' => 'post_not_found'], 404);
        }

        if ($field === 'content_body') {
            wp_update_post(['ID' => $post_id, 'post_content' => $after]);
        } elseif ($field === 'meta_title') {
            update_post_meta($post_id, '_aioseo_title', $after);
        } elseif ($field === 'meta_description') {
            update_post_meta($post_id, '_aioseo_description', $after);
        }

        return new WP_REST_Response(['success' => true, 'post_id' => $post_id], 200);
    }

    private function update_meta($data) {
        $url     = $data['url'] ?? '';
        $post_id = url_to_postid($url);
        if (!$post_id) return new WP_REST_Response(['success' => false, 'error' => 'post_not_found'], 404);
        if (!empty($data['meta_title']))       update_post_meta($post_id, '_aioseo_title', $data['meta_title']);
        if (!empty($data['meta_description'])) update_post_meta($post_id, '_aioseo_description', $data['meta_description']);
        if (!empty($data['h1']))               wp_update_post(['ID' => $post_id, 'post_title' => $data['h1']]);
        return new WP_REST_Response(['success' => true], 200);
    }

    private function create_draft($data) {
        $post_id = wp_insert_post([
            'post_title'   => $data['title'] ?? 'New Siloq Page',
            'post_content' => $data['content'] ?? '',
            'post_status'  => 'draft',
            'post_type'    => 'page',
            'post_name'    => $data['slug'] ?? '',
        ]);
        return new WP_REST_Response(['success' => !is_wp_error($post_id), 'post_id' => $post_id], 200);
    }
}
