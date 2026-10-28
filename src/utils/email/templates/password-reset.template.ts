export function buildPasswordResetTemplate(
  resetUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Khôi phục mật khẩu</title>
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
          <h1 style="color: #2563eb; margin-top: 0;">
            LaundryCare
          </h1>

          <h2 style="color: #1e293b;">
            Yêu cầu khôi phục mật khẩu
          </h2>

          <p style="color: #475569; line-height: 1.7;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản
            LaundryCare của bạn.
          </p>

          <p style="color: #475569; line-height: 1.7;">
            Nhấn nút bên dưới để tạo mật khẩu mới cho tài khoản.
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 14px 28px;
                background-color: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              Đặt lại mật khẩu
            </a>
          </div>

          <p style="color: #475569; line-height: 1.7;">
            Nếu bạn không nhấn được nút bên trên, hãy sao chép liên kết
            sau và mở bằng trình duyệt:
          </p>

          <p style="
            overflow-wrap: anywhere;
            word-break: break-word;
            font-size: 13px;
          ">
            <a href="${resetUrl}" style="color: #2563eb;">
              ${resetUrl}
            </a>
          </p>

          <div style="
            margin-top: 24px;
            padding: 16px;
            background-color: #eff6ff;
            border-radius: 8px;
          ">
            <p style="
              margin: 0;
              color: #1e40af;
              font-size: 13px;
              line-height: 1.7;
            ">
              <strong>Lưu ý bảo mật:</strong>
              Liên kết đặt lại mật khẩu chỉ có hiệu lực trong một khoảng
              thời gian nhất định. Nếu liên kết hết hạn, vui lòng gửi
              yêu cầu khôi phục mật khẩu mới.
            </p>
          </div>

          <p style="color: #64748b; line-height: 1.7;">
            Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này.
            Mật khẩu hiện tại của bạn sẽ không thay đổi chỉ vì email này
            được gửi đi.
          </p>

          <hr style="
            margin: 28px 0 16px;
            border: none;
            border-top: 1px solid #e2e8f0;
          " />

          <p style="
            margin-bottom: 0;
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.6;
          ">
            Email tự động từ LaundryCare. Vui lòng không trả lời email này.
            <br />
            Chăm sóc quần áo, chăm sóc cuộc sống.
          </p>
        </div>
      </body>
    </html>
  `;
}