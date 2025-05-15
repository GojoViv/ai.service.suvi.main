const HolidayEmailTemplate = (holidayName: string) => {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Upcoming Holiday Alert</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 20px;
          margin: auto;
          width: 80%;
          box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
        }
        .header {
          padding: 10px;
        }
        .cover-image {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
        }
        .content {
          margin: 20px 10px;
        }
        .divider {
          margin: 60px 0px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img
          src="[COMPANY_LOGO_URL]"
          alt="Holiday Cover Image"
          class="cover-image"
        />
        <div class="header">
          <h2>Upcoming Holiday Alert: ${holidayName}</h2>
        </div>
        <div class="content">
          <p>Hey team!</p>
          <p>
            Just a heads-up, tomorrow is <strong>${holidayName}</strong>. Hope you
            all enjoy a well-deserved break!
          </p>
          <div class="divider" />
          <p>Best</p>
          <p>Team HR</p>
        </div>
      </div>
    </body>
  </html>
  `;
};
export { HolidayEmailTemplate };
