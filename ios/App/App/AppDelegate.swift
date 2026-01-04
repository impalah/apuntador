import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var secureEnclaveBridge: SecureEnclaveWebBridge?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        // Registrar plugins personalizados de mTLS
        self.registerCustomPlugins()
        
        // Configurar el native bridge después de un pequeño delay
        // para asegurar que el WebView esté cargado
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.setupWebViewBridge()
        }
        
        return true
    }
    
    /**
     * Configura el puente WKWebView nativo
     */
    private func setupWebViewBridge() {
        // Buscar el CAPBridgeViewController en la jerarquía de vistas
        guard let rootVC = window?.rootViewController else {
            print("[AppDelegate] No root view controller")
            return
        }
        
        // Capacitor usa un CAPBridgeViewController
        if let bridgeVC = rootVC as? CAPBridgeViewController {
            setupBridgeForViewController(bridgeVC)
        } else if let navVC = rootVC as? UINavigationController,
                  let bridgeVC = navVC.viewControllers.first as? CAPBridgeViewController {
            setupBridgeForViewController(bridgeVC)
        } else {
            print("⚠️  [AppDelegate] Could not find CAPBridgeViewController")
        }
    }
    
    private func setupBridgeForViewController(_ bridgeVC: CAPBridgeViewController) {
        guard let webView = bridgeVC.webView else {
            print("[AppDelegate] WebView not found in bridge view controller")
            return
        }
        
        // print("[AppDelegate] WebView found, registering message handler")
        
        // Crear y registrar el bridge
        secureEnclaveBridge = SecureEnclaveWebBridge()
        webView.configuration.userContentController.add(secureEnclaveBridge!, name: "secureEnclave")
        
        // print("[AppDelegate] SecureEnclave message handler registered")
    }
    
    /**
     * Registra los plugins personalizados de mTLS con Capacitor
     */
    private func registerCustomPlugins() {
        // Forzar la carga de las clases de plugins para que Capacitor las encuentre
        // Usando CAPBridgedPlugin protocol (Capacitor 6+)
        _ = ApuntadorSecureEnclavePlugin.self
        _ = ApuntadorAutoEnrollmentPlugin.self
        _ = MTLSHttp.self
        
        // print("[AppDelegate] Custom plugins registration initialized")
        // print("ℹ️  Plugins loaded: ApuntadorSecureEnclavePlugin, ApuntadorAutoEnrollmentPlugin, MTLSHttp")
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
