package com.yueki.tekika;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 広告バナーの実際の位置をページに伝えるプラグイン（Bridge の作成前に登録する）
        registerPlugin(AdLayoutPlugin.class);
        // WebView のデバッグは Capacitor の既定に任せる（Debug ビルドでは有効、Release ビルドでは無効）
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Window window = getWindow();
            window.setNavigationBarColor(Color.WHITE);
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            );
        }
    }
}
