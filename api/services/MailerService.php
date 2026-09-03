<?php

class MailerService {
    /**
     * Sanitize header strings to prevent CRLF email header injection attacks.
     */
    private function sanitizeHeader(string $value): string {
        return trim(preg_replace('/[\r\n\0]+/', '', $value));
    }

    /**
     * Validate and sanitize email address for headers.
     */
    private function sanitizeEmail(string $email, string $fallback = 'studio@rohmadraws.com'): string {
        $clean = $this->sanitizeHeader($email);
        return filter_var($clean, FILTER_VALIDATE_EMAIL) ? $clean : $fallback;
    }

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
        $cleanEmail = $this->sanitizeEmail($recipientEmail);
        $cleanName = $this->sanitizeHeader($customerName);
        $cleanOrderNumber = $this->sanitizeHeader($orderNumber);

        $subject = "Your Fine Art Digital Download (Order #{$cleanOrderNumber}) - Rohma Draws Studio";
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
        $body .= "<p style='font-size: 16px;'>Dear " . htmlspecialchars($cleanName) . ",</p>";
        $body .= "<p style='font-size: 14px; line-height: 1.6;'>Thank you for acquiring fine art from Rohma Draws Studio (Order <strong>#" . htmlspecialchars($cleanOrderNumber) . "</strong>).</p>";
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
        $mailSent = @mail($cleanEmail, $subject, $body, $headers, "-f {$fromEmail}");

        // Dispatch Admin Notification Copy directly to Rohma (rkaramat03@gmail.com)
        $adminSubject = "[NEW SALE] Order #" . $cleanOrderNumber . " - " . $cleanName;
        $adminBody = "Hi Rohma,\n\nYou have received a new sale (Order #{$cleanOrderNumber}) on rohmadraws.com!\n\nCustomer: {$cleanName}\nEmail: {$cleanEmail}\nAmount Paid: Customer Order\n\nCheck your Admin Dashboard at https://rohmadraws.com/admin for full details.\n";
        $adminHeaders = "From: Rohma Draws Studio <{$fromEmail}>\r\nReply-To: {$cleanEmail}\r\n";
        @mail("rkaramat03@gmail.com", $adminSubject, $adminBody, $adminHeaders, "-f {$fromEmail}");

        error_log("Digital delivery email sent to {$cleanEmail} for Order #{$cleanOrderNumber}. Success: " . ($mailSent ? 'YES' : 'NO'));
        return $mailSent;
    }

    /**
     * Dispatch New Commission Inquiry notification directly to Rohma (rkaramat03@gmail.com).
     */
    public function sendCommissionAlertToRohma(array $req): bool {
        $to = "rkaramat03@gmail.com";
        $fromEmail = "studio@rohmadraws.com";
        $cleanName = $this->sanitizeHeader($req['name'] ?? 'Collector');
        $cleanEmail = $this->sanitizeEmail($req['email'] ?? '', $fromEmail);
        $subject = "[NEW COMMISSION INQUIRY] From " . $cleanName;
        
        $body = "Hi Rohma,\n\nA new commission inquiry has been submitted on your website!\n\n";
        $body .= "Name: " . $cleanName . "\n";
        $body .= "Email: " . $cleanEmail . "\n";
        $body .= "Budget: $" . $this->sanitizeHeader((string)($req['budget'] ?? '0')) . " USD\n";
        $body .= "Canvas Size: " . $this->sanitizeHeader($req['size'] ?? 'N/A') . "\n";
        $body .= "Description: " . ($req['description'] ?? 'N/A') . "\n\n";
        $body .= "Log in to your Admin Dashboard on https://rohmadraws.com/admin to view full reference moodboards and update inquiry status.\n";

        $headers = "From: Rohma Draws Studio <{$fromEmail}>\r\nReply-To: {$cleanEmail}\r\n";
        return @mail($to, $subject, $body, $headers, "-f {$fromEmail}");
    }
}
