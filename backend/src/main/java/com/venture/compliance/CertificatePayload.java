package com.venture.compliance;

/** A certificate file as sent by the browser: base64 inside the JSON body. */
public record CertificatePayload(String fileName, String mimeType, String dataBase64) {}
