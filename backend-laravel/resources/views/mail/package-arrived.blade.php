<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $subjectLine }} chegou</title>
</head>
<body style="margin:0;padding:24px 12px;background:#EEF3EC;font-family:Arial,Helvetica,sans-serif;color:#1F2A24;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;">
        <tr>
            <td style="padding:28px 24px 8px;">
                <p style="margin:0 0 4px;font-size:15px;color:#4B5B51;">{{ $package->association->name }}</p>
                <h1 style="margin:0;font-size:24px;line-height:1.3;">Olá, {{ $firstName }}! {{ $subjectLine }} chegou.</h1>
            </td>
        </tr>
        <tr>
            <td style="padding:12px 24px;">
                <p style="margin:0;font-size:17px;line-height:1.5;">Pode retirar na associação quando quiser 😊</p>
            </td>
        </tr>
        <tr>
            <td style="padding:12px 24px;">
                <div style="background:#FFF4D6;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;font-size:15px;color:#4B5B51;">Código de retirada</p>
                    <p style="margin:4px 0 0;font-size:36px;font-weight:bold;letter-spacing:6px;">{{ $package->pickup_code }}</p>
                </div>
            </td>
        </tr>
        @if ($package->description || $package->association->pickup_hours)
        <tr>
            <td style="padding:12px 24px 28px;font-size:16px;line-height:1.6;">
                @if ($package->description)
                    <p style="margin:0;"><strong>Descrição:</strong> {{ $package->description }}</p>
                @endif
                @if ($package->association->pickup_hours)
                    <p style="margin:0;"><strong>Horário de retirada:</strong> {{ $package->association->pickup_hours }}</p>
                @endif
            </td>
        </tr>
        @endif
    </table>
</body>
</html>
