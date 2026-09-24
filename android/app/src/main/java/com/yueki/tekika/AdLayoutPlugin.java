package com.yueki.tekika;

import android.os.Build;
import android.view.WindowInsets;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 広告バナーの実際の位置をページ側に伝えるためのプラグイン。
 *
 * Android 15 以上では、AdMob プラグイン（BannerExecutor）がバナーの下にナビゲーションバーの高さぶんの
 * 余白を付ける。このアプリの WebView はすでにナビゲーションバーを避けて配置されているため、
 * バナーは WebView の下端より、その高さぶん上に表示される。ページはこの値を使ってバナーの上端を求める。
 */
@CapacitorPlugin(name = "AdLayout")
public class AdLayoutPlugin extends Plugin {

    // バナーが WebView の下端から持ち上がっている量（CSS px）。Android 14 以下は 0
    @PluginMethod
    public void getBannerBottomOffset(PluginCall call) {
        float offsetPx = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            WindowInsets insets = getActivity().getWindow().getDecorView().getRootWindowInsets();
            if (insets != null) {
                // AdMob プラグインと同じ値を使う
                offsetPx = insets.getSystemWindowInsetBottom();
            }
        }
        float density = getContext().getResources().getDisplayMetrics().density;
        JSObject ret = new JSObject();
        ret.put("offset", offsetPx / density);
        call.resolve(ret);
    }
}
