export function buildEmailVerificationTemplate(
  verificationUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Xác thực email</title>
      </head>

      <body style="
        margin: 0;
        padding: 24px;
        background-color: #f3f7fc;
        font-family: Arial, sans-serif;
      ">
        <div style="
          max-width: 560px;
          margin: 0 auto;
          padding: 32px;
          background-color: #ffffff;
          border-radius: 12px;
        ">
          <h1 style="color: #2563eb;">
            LaundryCare
          </h1>

          <h2>Xác thực địa chỉ email</h2>

          <p>
            Cảm ơn bạn đã đăng ký tài khoản LaundryCare.
            Vui lòng nhấn nút bên dưới để xác thực địa chỉ email.
          </p>

          <a
            href="${verificationUrl}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
            "
          >
            Xác thực email
          </a>

          <p>
            Nếu bạn không thực hiện đăng ký này, hãy bỏ qua email.
          </p>

          <p style="color: #64748b; font-size: 12px;">
            Liên kết xác thực có thời hạn sử dụng.
          </p>
        </div>
      </body>
    </html>
  `;
}