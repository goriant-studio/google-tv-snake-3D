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
            @Suppress("DEPRECATION")
            settings.allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            settings.allowUniversalAccessFromFileURLs = true
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

        // Fullscreen immersive mode — must be called AFTER setContentView
        // so the window is fully attached and DecorView is not null
        setupFullscreen()

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
            // insetsController may be null if window is not yet fully attached;
            // use window.decorView.post to defer if needed
            val applyInsets = Runnable {
                window.insetsController?.let { controller ->
                    controller.hide(WindowInsets.Type.systemBars())
                    controller.systemBarsBehavior =
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            }
            if (window.insetsController != null) {
                applyInsets.run()
            } else {
                window.decorView.post(applyInsets)
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

    // Maps Android KeyEvent code → web KeyboardEvent.key string
    private val keyCodeToJsKey = mapOf(
        KeyEvent.KEYCODE_DPAD_UP        to "ArrowUp",
        KeyEvent.KEYCODE_DPAD_DOWN      to "ArrowDown",
        KeyEvent.KEYCODE_DPAD_LEFT      to "ArrowLeft",
        KeyEvent.KEYCODE_DPAD_RIGHT     to "ArrowRight",
        KeyEvent.KEYCODE_DPAD_CENTER    to "Enter",
        KeyEvent.KEYCODE_ENTER          to "Enter",
        KeyEvent.KEYCODE_SPACE          to "Space",
        KeyEvent.KEYCODE_BUTTON_A       to "Enter",
        KeyEvent.KEYCODE_BUTTON_B       to "Escape",
        KeyEvent.KEYCODE_BUTTON_START   to "Enter"
    )

    /**
     * Inject a real KeyboardEvent into the page's document so the game JS
     * listeners receive it — WebView native dispatch only moves DOM focus.
     */
    private fun injectKeyEvent(jsKey: String, type: String) {
        val safeKey = jsKey.replace("\\", "\\\\").replace("\"", "\\\"")
        val js = """
            try {
                var e = new KeyboardEvent('$type', {
                    key: "$safeKey",
                    code: "$safeKey",
                    bubbles: true,
                    cancelable: true
                });
                window.dispatchEvent(e);
            } catch(err) {
                console.error("Snake3D KeyInject Error:", err);
            }
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    /**
     * Intercept D-pad / remote key events BEFORE WebView consumes them.
     * WebView natively consumes DPAD_CENTER / ENTER for synthetic clicks.
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val jsKey = keyCodeToJsKey[event.keyCode]
        
        if (jsKey != null) {
            // Only inject on down/up, avoid multiple repeats if not needed or handle naturally
            if (event.action == KeyEvent.ACTION_DOWN) {
                injectKeyEvent(jsKey, "keydown")
            } else if (event.action == KeyEvent.ACTION_UP) {
                injectKeyEvent(jsKey, "keyup")
            }
            // Always consume our known game keys so WebView doesn't do focus navigation
            return true
        }

        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_DOWN) {
            return handleBackPress()
        }

        return super.dispatchKeyEvent(event)
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
