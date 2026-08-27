<?php

class MailerService {
    /**
     * Dispatch confirmation email to customer with high-resolution digital artwork JPEG attached,
     * and send an instant admin notification copy to Rohma (rkaramat03@gmail.com).
     */
    public function sendDigitalDeliveryWithAttachment(
        string $recipientEmail,
        string $customerName,
        string $orderNumber,
        array $digitalItems
    ): bool {
        $subject = "Your Fine Art Digital Download (Order #{$orderNumber}) - Rohma Draws Studio";
        $fromEmail = "studio@rohmadraws.com";
        $fromName = "Rohma Draws Studio";

        $boundary = md5(time() . bin2hex(random_bytes(4)));

        // Multipart Headers with explicit Return-Path
        $headers = "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "Reply-To: rkaramat03@gmail.com\r\n";
        $headers .= "Return-Path: {$fromEmail}\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

        // Plain Text & HTML Body
        $body = "--{$boundary}\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        
        $body .= "<div style='font-family: serif; color: #3D262A; max-width: 600px; padding: 20px; border: 2px solid #E5C3B2; background-color: #F7F5F0; border-radius: 12px;'>";
        $body .= "<h2 style='color: #6B2337; font-size: 24px; margin-bottom: 10px;'>Rohma Draws Studio</h2>";
        $body .= "<p style='font-size: 16px;'>Dear " . htmlspecialchars($customerName) . ",</p>";
        $body .= "<p style='font-size: 14px; line-height: 1.6;'>Thank you for acquiring fine art from Rohma Draws Studio (Order <strong>#{$orderNumber}</strong>).</p>";
        $body .= "<p style='font-size: 14px; line-height: 1.6;'>Your high-resolution archival digital artwork file(s) are attached directly to this email for instant download and printing.</p>";
        
        $body .= "<div style='background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #E5C3B2; margin: 15px 0;'>";
        $body .= "<strong style='color: #6B2337;'>Acquired Digital Items:</strong><ul style='margin-top: 5px; padding-left: 20px;'>";
        foreach ($digitalItems as $item) {
            $body .= "<li>" . htmlspecialchars($item['title'] ?? 'Digital Fine Art') . "</li>";
        }
        $body .= "</ul></div>";

        $body .= "<p style='font-size: 13px; color: #6B2337;'>If you have any questions or require custom print formatting guidance, please reply directly to this email or contact <a href='mailto:rkaramat03@gmail.com' style='color: #6B2337; font-weight: bold;'>rkaramat03@gmail.com</a>.</p>";
        $body .= "<br/><p style='font-size: 14px;'>Warm regards,<br/><strong>Rohma Draws Studio</strong><br/><a href='https://rohmadraws.com' style='color: #6B2337;'>rohmadraws.com</a></p>";
        $body .= "</div>\r\n\r\n";

        // Attach High-Res JPEG Files
        foreach ($digitalItems as $item) {
            $filePath = $item['file_path'] ?? null;
            if ($filePath && file_exists($filePath)) {
                $fileName = basename($filePath);
                $fileData = file_get_contents($filePath);
                $encodedData = chunk_split(base64_encode($fileData));

                $body .= "--{$boundary}\r\n";
                $body .= "Content-Type: image/jpeg; name=\"{$fileName}\"\r\n";
                $body .= "Content-Description: {$fileName}\r\n";
                $body .= "Content-Disposition: attachment; filename=\"{$fileName}\"\r\n";
                $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
                $body .= $encodedData . "\r\n";
            }
        }

        $body .= "--{$boundary}--";

        // Dispatch Customer Email
        $mailSent = @mail($recipientEmail, $subject, $body, $headers, "-f {$fromEmail}");

        // Dispatch Admin Notification Copy directly to Rohma (rkaramat03@gmail.com)
        $adminSubject = "[NEW SALE] Order #{$orderNumber} - {$customerName}";
        $adminBody = "Hi Rohma,\n\nYou have received a new sale (Order #{$orderNumber}) on rohmadraws.com!\n\nCustomer: {$customerName}\nEmail: {$recipientEmail}\nAmount Paid: Customer Order\n\nCheck your Admin Dashboard at https://rohmadraws.com/admin for full details.\n";
        $adminHeaders = "From: Rohma Draws Studio <{$fromEmail}>\r\nReply-To: {$recipientEmail}\r\n";
        @mail("rkaramat03@gmail.com", $adminSubject, $adminBody, $adminHeaders, "-f {$fromEmail}");

        error_log("Digital delivery email sent to {$recipientEmail} for Order #{$orderNumber}. Success: " . ($mailSent ? 'YES' : 'NO'));
        return $mailSent;
    }

    /**
     * Dispatch New Commission Inquiry notification directly to Rohma (rkaramat03@gmail.com).
     */
    public function sendCommissionAlertToRohma(array $req): bool {
        $to = "rkaramat03@gmail.com";
        $fromEmail = "studio@rohmadraws.com";
        $subject = "[NEW COMMISSION INQUIRY] From " . ($req['name'] ?? 'Collector');
        
        $body = "Hi Rohma,\n\nA new commission inquiry has been submitted on your website!\n\n";
        $body .= "Name: " . ($req['name'] ?? 'N/A') . "\n";
        $body .= "Email: " . ($req['email'] ?? 'N/A') . "\n";
        $body .= "Budget: $" . ($req['budget'] ?? '0') . " USD\n";
        $body .= "Canvas Size: " . ($req['size'] ?? 'N/A') . "\n";
        $body .= "Description: " . ($req['description'] ?? 'N/A') . "\n\n";
        $body .= "Log in to your Admin Dashboard on https://rohmadraws.com/admin to view full reference moodboards and update inquiry status.\n";

        $headers = "From: Rohma Draws Studio <{$fromEmail}>\r\nReply-To: " . ($req['email'] ?? $fromEmail) . "\r\n";
        return @mail($to, $subject, $body, $headers, "-f {$fromEmail}");
    }
}
