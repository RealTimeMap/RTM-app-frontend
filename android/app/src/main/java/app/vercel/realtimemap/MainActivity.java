package app.vercel.realtimemap;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int TABLET_MIN_WIDTH_DP = 600;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        if (getResources().getConfiguration().smallestScreenWidthDp < TABLET_MIN_WIDTH_DP) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
        registerPlugin(LiveCapsulePlugin.class);
        registerPlugin(DistributionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
