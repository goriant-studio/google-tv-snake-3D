package com.goriant.snake3d

import android.annotation.SuppressLint
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity

/**
 * MainActivity — Fullscreen WebView for Snake 3D
 *
 * Loads the web game from local assets and handles
 * TV remote D-pad input → WebView keyboard events.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var backPressedTime: Long = 0

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen immersive mode
        setupFullscreen()

        // Create WebView programmatically (no XML layout needed)
        webView = WebView(this).apply {
            // Enable JavaScript (required for Three.js)
            settings.javaScriptEnabled = true

            // Enable WebGL / hardware acceleration
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Performance settings
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            setLayerType(View.LAYER_TYPE_HARDWARE, null)

            // Disable scrolling / overscroll
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER

            // WebView clients
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()

            // Focus for key events
            isFocusable = true
            isFocusableInTouchMode = true
            requestFocus()
        }

        setContentView(webView)

        // Load game from assets
        webView.loadUrl("file:///android_asset/www/index.html")
    }

    /**
     * Setup fullscreen immersive mode — hide system bars
     */
    private fun setupFullscreen() {
        // Keep screen on while playing
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.systemBars())
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
        }
    }

    /**
     * Forward D-pad key events to WebView
     *
     * The TV remote D-pad sends standard KeyEvent codes:
     * - KEYCODE_DPAD_UP, DOWN, LEFT, RIGHT
     * - KEYCODE_DPAD_CENTER (select/enter)
     * - KEYCODE_ENTER
     *
     * These are automatically mapped to keyboard events in WebView,
     * so the web game's existing arrow key handling works out of the box.
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Let WebView handle D-pad and Enter natively
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_SPACE,
            KeyEvent.KEYCODE_BUTTON_A,
            KeyEvent.KEYCODE_BUTTON_B,
            KeyEvent.KEYCODE_BUTTON_START -> {
                // Forward to WebView — it will dispatch as KeyboardEvent
                return webView.dispatchKeyEvent(event!!)
            }

            KeyEvent.KEYCODE_BACK -> {
                return handleBackPress()
            }
        }

        return super.onKeyDown(keyCode, event)
    }

    /**
     * Double-press back to exit (prevent accidental exit during gameplay)
     */
    private fun handleBackPress(): Boolean {
        if (System.currentTimeMillis() - backPressedTime < 2000) {
            finish()
            return true
        }
        backPressedTime = System.currentTimeMillis()
        Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show()
        return true
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        setupFullscreen()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
