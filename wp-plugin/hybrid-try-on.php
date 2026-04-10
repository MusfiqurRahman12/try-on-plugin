<?php
/**
 * Plugin Name: Hybrid Try-On System
 * Plugin URI: https://accelvia.com
 * Description: Injects an AI Virtual Try-On iFrame widget onto WooCommerce product pages. Communicates securely with an external Vercel React Application.
 * Version: 1.0.0
 * Author: Accelvia
 * Text Domain: hybrid-tryon
 */

if (!defined('ABSPATH')) {
    exit;
}

class Hybrid_Try_On {
    
    public function __construct() {
        // Enqueue scripts and styles on product pages
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        
        // Add "Virtual Try On" button to WooCommerce single product page
        add_action('woocommerce_after_add_to_cart_button', array($this, 'add_try_on_button'));
        
        // Output modal HTML to footer
        add_action('wp_footer', array($this, 'output_modal_html'));
    }

    public function enqueue_assets() {
        if (is_product()) {
            wp_enqueue_style('hybrid-tryon-css', plugin_dir_url(__FILE__) . 'assets/tryon.css', array(), '1.0.0');
            wp_enqueue_script('hybrid-tryon-js', plugin_dir_url(__FILE__) . 'assets/tryon.js', array('jquery'), '1.0.0', true);

            global $product;
            if ($product) {
                // Pass product data to JavaScript
                $product_data = array(
                    'id' => $product->get_sku() ? $product->get_sku() : $product->get_id(),
                    'image_url' => wp_get_attachment_url($product->get_image_id()),
                    'app_url' => 'https://tryonfeature.vercel.app' // Live Vercel URL
                );
                wp_localize_script('hybrid-tryon-js', 'hyridTryOnData', $product_data);
            }
        }
    }

    public function add_try_on_button() {
        echo '<button type="button" class="button alt hybrid-tryon-btn" id="open-tryon-modal" style="margin-left: 10px; background-color: #6366f1; color: white;">Virtual Try-On 💅</button>';
    }

    public function output_modal_html() {
        if (is_product()) {
            ?>
            <div id="hybrid-tryon-modal" class="hybrid-tryon-modal-overlay" style="display: none;">
                <div class="hybrid-tryon-modal-content">
                    <button id="close-tryon-modal" class="hybrid-tryon-close-btn">&times;</button>
                    <!-- Iframe container -->
                    <iframe id="hybrid-tryon-iframe" src="" frameborder="0" width="100%" height="100%"></iframe>
                </div>
            </div>
            <?php
        }
    }
}

new Hybrid_Try_On();
