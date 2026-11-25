package com.healthcare.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@Slf4j
public class SmsService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${notification.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${notification.sms.provider:notifylk}")
    private String provider;

    // Notify.lk config
    @Value("${notification.sms.notifylk.user-id:}")
    private String notifyUserId;
    @Value("${notification.sms.notifylk.api-key:}")
    private String notifyApiKey;
    @Value("${notification.sms.notifylk.sender-id:NotifyDEMO}")
    private String notifySenderId;

    // Twilio config
    @Value("${notification.sms.twilio.account-sid:}")
    private String twilioSid;
    @Value("${notification.sms.twilio.auth-token:}")
    private String twilioAuthToken;
    @Value("${notification.sms.twilio.from-number:}")
    private String twilioFromNumber;

    public void sendSms(String toPhone, String messageText) {
        // Always log to Docker console
        log.info("\n================ SMS DISPATCHED ================\n" +
                 "To: {}\nMessage: {}\n" +
                 "================================================", toPhone, messageText);

        if (!smsEnabled || toPhone == null || toPhone.isBlank()) {
            log.info("[SmsService] Live SMS disabled or phone empty. Logged only.");
            return;
        }

        try {
            if ("twilio".equalsIgnoreCase(provider)) {
                sendViaTwilio(toPhone.trim(), messageText);
            } else {
                sendViaNotifyLk(toPhone.trim(), messageText);
            }
        } catch (Exception e) {
            log.error("[SmsService] Failed to send live SMS to {}: {}", toPhone, e.getMessage());
        }
    }

    private void sendViaNotifyLk(String phone, String messageText) {
        // Notify.lk expects format 9477XXXXXXX (without leading '+')
        String formattedPhone = phone.replaceAll("[^0-9]", "");
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "94" + formattedPhone.substring(1);
        }

        String url = "https://app.notify.lk/api/v1/send";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("user_id", notifyUserId);
        form.add("api_key", notifyApiKey);
        form.add("sender_id", notifySenderId);
        form.add("to", formattedPhone);
        form.add("message", messageText);

        ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(form, headers), String.class);
        log.info("[SmsService - Notify.lk] Status: {} | Response: {}", response.getStatusCode(), response.getBody());
    }

    private void sendViaTwilio(String phone, String messageText) {
        // Twilio expects E.164 format (+9477XXXXXXX)
        String formattedPhone = phone.startsWith("+") ? phone : "+" + phone.replaceAll("[^0-9]", "");
        String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioSid + "/Messages.json";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String auth = Base64.getEncoder().encodeToString((twilioSid + ":" + twilioAuthToken).getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + auth);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", formattedPhone);
        form.add("From", twilioFromNumber);
        form.add("Body", messageText);

        ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(form, headers), String.class);
        log.info("[SmsService - Twilio] Status: {} | SMS queued for {}", response.getStatusCode(), formattedPhone);
    }
}