# Bandwidth Bucks — Sideloaded Android APK Prototype

## Project Goal

Create an Android APK (“Bandwidth Bucks”) that:
- Acts as a background internet-sharing node (like Honeygain/Pawns)
- Runs a persistent foreground service to avoid being killed
- Displays UI matching your [bandwidth-bucks-bkes.vercel.app](https://bandwidth-bucks-bkes.vercel.app) website
- Can be sideloaded (not posted on Google Play), for demo and early active user engagement
- Is expandable with backend/SKD integration later, after acquiring users

---

## How Does the APK Work?

- Loads your website’s UI in a native WebView, so it matches your branding and design exactly.
- Has a “Start Background Node” button that starts a persistent Android foreground service.
- Service is ready for extension with real network traffic sharing code and backend communication.

---

## Quick Start — Code Overview

### 1. Android Manifest

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.bandwidthbucks.app">

    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    
    <application
        android:allowBackup="true"
        android:label="BandwidthBucks"
        android:supportsRtl="true">
        
        <activity android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service android:name=".NodeService"
                 android:exported="false"/>
    </application>
</manifest>
```

---

### 2. MainActivity (WebView + Start Service Button)

```java
package com.bandwidthbucks.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebView webview = findViewById(R.id.webview);
        webview.setWebViewClient(new WebViewClient());
        webview.getSettings().setJavaScriptEnabled(true);
        webview.loadUrl("https://bandwidth-bucks-bkes.vercel.app/");

        Button startNode = findViewById(R.id.start_node);
        startNode.setOnClickListener(v -> {
            Intent serviceIntent = new Intent(this, NodeService.class);
            startForegroundService(serviceIntent);
        });
    }
}
```

---

### 3. Layout XML (activity_main.xml)

```xml
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_weight="1"
        android:layout_height="0dp" />

    <Button
        android:id="@+id/start_node"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Start Background Node"/>
</LinearLayout>
```

---

### 4. Foreground Service Skeleton (NodeService.java)

```java
package com.bandwidthbucks.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

public class NodeService extends Service {
    private static final String CHANNEL_ID = "NodeServiceChannel";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        Notification notification = new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("Bandwidth Node Running")
            .setContentText("Your device is sharing bandwidth in the background.")
            .setSmallIcon(R.drawable.ic_notification)
            .build();

        startForeground(1, notification);

        // TODO: Add your network traffic sharing code here

        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Node Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
```

---

## Sideloading Instructions

1. Build the APK in Android Studio:  
   > **Build > Build bundle(s)/APK(s) > Build APK(s)**
2. Share the APK file with testers:  
   > **Direct message, website download, Telegram, email, etc.**
3. Users install by allowing “Install from unknown sources”, and then launch the app.

---

## Next Steps for Full Bandwidth Node

- Extend `NodeService` with VPNService, socket, or proxy code to handle real traffic
- Connect with your backend for authentication, traffic metering, and earnings
- When ready, talk to SDK providers and commercial partners

---

## FAQ

**Will my APK look like the website?**  
Yes—WebView will use your live site’s UI and design.

**Is this conversation and code saved in my Git repo?**  
Only if you copy this README.md or I help you commit it.

**Can I expand native Android UI?**  
Yes! You can add more native controls alongside the WebView.

---

_Last updated: 2026-02-27 20:04:45_