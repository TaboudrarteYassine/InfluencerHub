<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #f8fafc; margin: 0; padding: 0; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #0a0a0a; padding-bottom: 60px; }
        .main { max-width: 600px; margin: 0 auto; width: 100%; background-color: #111111; border-radius: 12px; margin-top: 40px; overflow: hidden; border: 1px solid #1f1f1f; }
        .header { padding: 30px; text-align: center; border-bottom: 1px solid #1f1f1f; }
        .logo { font-size: 24px; font-weight: bold; color: #ffffff; text-decoration: none; }
        .logo span { color: #8b5cf6; }
        .content { padding: 40px 30px; line-height: 1.6; color: #cbd5e1; }
        h1 { color: #ffffff; font-size: 22px; margin-top: 0; margin-bottom: 20px; font-weight: 600; }
        .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; margin-bottom: 20px; text-align: center; }
        .footer { padding: 30px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #1f1f1f; }
        .footer a { color: #8b5cf6; text-decoration: none; }
        .box { background-color: #1a1a1a; border: 1px solid #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <center class="wrapper">
        <table class="main" width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td class="header">
                    <a href="{{ url('/') }}" class="logo">Influence<span>Hub</span></a>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <h1>Your verification is under review</h1>
<p>Hi {{ $name }},</p>
<p>We have successfully received your KYC documents. Our team is currently reviewing your profile to ensure trust and safety across the platform.</p>
<div class="box">
    <strong>Review Time:</strong> Usually takes 24-48 hours.
</div>
<p>We will notify you by email as soon as the review is complete.</p>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p>© {{ date('Y') }} InfluenceHub. Made in Morocco 🇲🇦</p>
                    <p>You received this email because you're registered on our platform.</p>
                    <p><a href="{{ url('/unsubscribe') }}">Unsubscribe</a></p>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>