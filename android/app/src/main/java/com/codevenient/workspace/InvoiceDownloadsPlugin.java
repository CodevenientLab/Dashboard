package com.codevenient.workspace;

import android.content.ContentValues;
import android.Manifest;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PermissionState;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "InvoiceDownloads",
    permissions = {
        @Permission(
            alias = "storage",
            strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }
        )
    }
)
public class InvoiceDownloadsPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            if (getPermissionState("storage") != PermissionState.GRANTED) {
                requestPermissionForAlias("storage", call, "saveWithStoragePermission");
                return;
            }
            saveToLegacyDownloads(call);
            return;
        }

        saveToMediaDownloads(call);
    }

    @PermissionCallback
    private void saveWithStoragePermission(PluginCall call) {
        if (getPermissionState("storage") != PermissionState.GRANTED) {
            call.reject("Storage permission is required to save invoices to Downloads.");
            return;
        }
        saveToLegacyDownloads(call);
    }

    private void saveToMediaDownloads(PluginCall call) {
        String filename = getSafeFilename(call);
        String data = getPdfData(call);
        if (filename == null || data == null) return;

        Uri fileUri = null;
        try {
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
            values.put(
                MediaStore.MediaColumns.RELATIVE_PATH,
                Environment.DIRECTORY_DOWNLOADS
            );
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);

            fileUri = getContext().getContentResolver().insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                values
            );
            if (fileUri == null) {
                throw new IllegalStateException("Android could not create the invoice download.");
            }

            byte[] pdfBytes = Base64.decode(data, Base64.DEFAULT);
            try (OutputStream output = getContext().getContentResolver().openOutputStream(fileUri)) {
                if (output == null) {
                    throw new IllegalStateException("Android could not open the invoice download.");
                }
                output.write(pdfBytes);
            }

            ContentValues completed = new ContentValues();
            completed.put(MediaStore.MediaColumns.IS_PENDING, 0);
            getContext().getContentResolver().update(fileUri, completed, null, null);

            JSObject result = new JSObject();
            result.put("uri", fileUri.toString());
            call.resolve(result);
        } catch (Exception error) {
            if (fileUri != null) {
                getContext().getContentResolver().delete(fileUri, null, null);
            }
            call.reject("Could not save the invoice PDF to Downloads.", error);
        }
    }

    private void saveToLegacyDownloads(PluginCall call) {
        String filename = getSafeFilename(call);
        String data = getPdfData(call);
        if (filename == null || data == null) return;

        try {
            File downloads = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOWNLOADS
            );
            if (!downloads.isDirectory() && !downloads.mkdirs()) {
                throw new IllegalStateException("Android could not access the Downloads folder.");
            }

            File outputFile = new File(downloads, filename);
            try (FileOutputStream output = new FileOutputStream(outputFile)) {
                output.write(Base64.decode(data, Base64.DEFAULT));
            }

            JSObject result = new JSObject();
            result.put("uri", Uri.fromFile(outputFile).toString());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not save the invoice PDF to Downloads.", error);
        }
    }

    private String getSafeFilename(PluginCall call) {
        String filename = call.getString("filename");
        if (filename == null || filename.isEmpty()) {
            call.reject("Invoice PDF filename is missing.");
            return null;
        }
        filename = filename.replaceAll("[\\\\/:*?\"<>|]", "-");
        if (!filename.toLowerCase().endsWith(".pdf")) {
            filename += ".pdf";
        }
        return filename;
    }

    private String getPdfData(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("Invoice PDF data is missing.");
            return null;
        }
        return data;
    }
}
