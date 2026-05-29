use tauri::{Runtime, WebviewWindow};

pub struct Snap<R: Runtime> {
    app: tauri::AppHandle<R>,
}

impl<R: Runtime> Snap<R> {
    pub fn new(app: tauri::AppHandle<R>) -> Self {
        Self { app }
    }

    pub fn app_handle(&self) -> &tauri::AppHandle<R> {
        &self.app
    }

    /// Explicit helper to programmatically force-remove bounds subclassing layout filters if needed.
    #[allow(unused_variables)]
    pub fn detach_snap_zone(&self, window: &WebviewWindow<R>) -> crate::Result<()> {
        #[cfg(windows)]
        {
            let version = windows_version::OsVersion::current();
            if version.build >= 22000 {
                return crate::platform::snap::uninstall(window);
            }
        }
        Ok(())
    }
}
