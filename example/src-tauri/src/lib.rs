#[tauri::command]
async fn create_window(app: tauri::AppHandle) {
    let webview_window = tauri::WebviewWindowBuilder::new(
        &app,
        "secondary",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .decorations(false)
    .build()
    .unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_snap_layout::SnapLayoutArea::new()
                .button_id("snap-btn")
                .debug_color("#00000000")
                .display(true)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![create_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
