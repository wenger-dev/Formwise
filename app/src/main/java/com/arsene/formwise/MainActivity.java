package com.arsene.formwise;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.content.ContentValues;
import android.provider.MediaStore;
import android.os.Build;

import java.io.OutputStream;
import java.io.IOException;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> fileChooserCallback;
    private static final int FILE_CHOOSER_REQUEST = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        webView.addJavascriptInterface(new FormwiseBridge(), "FormwiseAndroid");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equalsIgnoreCase(uri.getScheme()) || "about".equalsIgnoreCase(uri.getScheme())) return false;
                if ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException e) { Toast.makeText(MainActivity.this, "No browser found to open this link", Toast.LENGTH_SHORT).show(); }
                    return true;
                }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = callback;
                Intent intent = params.createIntent();
                try { startActivityForResult(intent, FILE_CHOOSER_REQUEST); }
                catch (ActivityNotFoundException e) { fileChooserCallback = null; Toast.makeText(MainActivity.this, "No file picker available", Toast.LENGTH_SHORT).show(); return false; }
                return true;
            }
        });
        webView.loadUrl("file:///android_asset/index.html");
    }

    private class FormwiseBridge {
        @JavascriptInterface public void saveJson(String json, String filename) {
            runOnUiThread(() -> saveJsonToDownloads(json, filename));
        }
    }

    private void saveJsonToDownloads(String json, String filename) {
        OutputStream out = null;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IOException("Could not create download file");
                out = getContentResolver().openOutputStream(uri);
            } else {
                java.io.File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("Could not access Downloads folder");
                out = new java.io.FileOutputStream(new java.io.File(dir, filename));
            }
            if (out == null) throw new IOException("Could not open download file");
            out.write(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            out.flush();
            Toast.makeText(this, "Backup saved to Downloads", Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(this, "Could not save backup: " + e.getMessage(), Toast.LENGTH_LONG).show();
        } finally {
            if (out != null) try { out.close(); } catch (IOException ignored) {}
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && fileChooserCallback != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileChooserCallback.onReceiveValue(results);
            fileChooserCallback = null;
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
