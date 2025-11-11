package io.apuntador.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register custom plugins BEFORE calling super.onCreate()
        registerPlugin(ImmersiveModePlugin.class);
        registerPlugin(AndroidOAuthPlugin.class);
        registerPlugin(DeviceEnrollmentPlugin.class);
        registerPlugin(MTLSClientPlugin.class);
        
        super.onCreate(savedInstanceState);
        
        // Enable edge-to-edge display
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );
    }
    
    // Removed automatic immersive mode - now controlled by the app
}
