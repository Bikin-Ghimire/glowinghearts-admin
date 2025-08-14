export const TEMPLATE_PURCHASE_HTML = `<div style='width: 100%; display: block; text-align: center; padding-top: 30px'>
  <img
    style='border-radius: 10px; max-width: 900px; width: 100%'
    src='~bannerlocal~'
  />
</div>
<div style='width: 100%; display: block; text-align: center; padding-top: 10px'>
  <h1 style='color: green'>Thank you for your purchase!</h1>
  <p>
    Your transaction id <b>~purchaseid~</b> was confirmed on <b>~dtdate~</b> for
    raffle id <b>~raffleid~</b>
  </p>
</div>
<div style='width: 100%; display: block; text-align: center; padding-top: 10px'>
  <div
    style='
      padding: 5px;
      border-radius: 10px;
      max-width: 900px;
      width: 100%;
      background-color: #efefef;
      margin: auto;
      border-radius: 10px;
      padding: 20px 10px;
      box-sizing: border-box;
    '
  >
    <h3>Transaction Details</h3>
    <div style='width: 100%'>~packages~</div>
    <div
      style='
        width: 100%;
        margin: auto;
        max-width: 700px;
        background-color: #fff;
        margin-top: 10px;;
      '
    >
      <table
        style='
          width: 100%;
          border-collapse: collapse;
          border-radius: 10px;
          overflow: hidden;
        '
      >
        <tr>
          <td style='padding: 20px 20px 5px; font-weight: bold'>Full Name</td>
          <td style='padding: 20px 20px 5px'>~fullname~</td>
        </tr>
        <tr>
          <td style='padding: 5px 20px; font-weight: bold'>Email</td>
          <td style='padding: 5px 20px'>~vcplayeremail~</td>
        </tr>
        <tr>
          <td style='padding: 5px 20px; font-weight: bold'>Phone Number</td>
          <td style='padding: 5px 20px'>~vcplayerphone~</td>
        </tr>
        <tr>
          <td style='padding: 5px 20px; font-weight: bold'>Address Line 1</td>
          <td style='padding: 5px 20px'>~vcplayeraddr1~</td>
        </tr>
        <tr>
          <td style='padding: 5px 20px; font-weight: bold'>Address Line 2</td>
          <td style='padding: 5px 20px'>~vcplayeraddr2~</td>
        </tr>
        <tr>
          <td style='padding: 5px 20px; font-weight: bold'>City</td>
          <td style='padding: 5px 20px'>~vcplayercity~</td>
        </tr>
        <tr>
          <td style='padding: 5px 20px; font-weight: bold'>Province</td>
          <td style='padding: 5px 20px'>~vcplayerprovince~</td>
        </tr>
        <tr>
          <td style='padding: 5px 20px 20px; font-weight: bold'>Postal Code</td>
          <td style='padding: 5px 20px 20px'>~vcplayerpostal~</td>
        </tr>
      </table>
    </div>
  </div>
</div>
<div style='width: 100%; display: block; text-align: center; padding-top: 10px'>
  <div
    style='
      padding: 5px;
      border-radius: 10px;
      max-width: 900px;
      width: 100%;
      background-color: #efefef;
      margin: auto;
      border-radius: 10px;
      padding: 20px 10px;
      box-sizing: border-box;
    '
  >
    <h3>Your Tickets</h3>
    <div style='width: 100%'>~tickets~</div>
  </div>
</div>
`

export const TEMPLATE_WINNER_HTML = `<div>Congrats you Won!<\/div>

<!-- player\/ order details-->
<div style="display: flex;
            flex-direction: row;">
    <div>Full Name:<\/div>
    <div>~fullname~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Date Purchased:<\/div>
    <div>~dtpurchase~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Player Email:<\/div>
    <div>~vcplayeremail~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Player Address Line 1:<\/div>
    <div>~vcplayeraddr1~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Player Address Line 2:<\/div>
    <div>~vcplayeraddr2~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Player City:<\/div>
    <div>~vcplayercity~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Player Province:<\/div>
    <div>~vcplayerprovince~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Player Postal Code:<\/div>
    <div>~vcplayerpostal~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Player Phone:<\/div>
    <div>~vcplayerphone~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Winning Ticket:<\/div>
    <div>~wintickets~<\/div>
<\/div>
<!-- Prize Details-->
<div style="display: flex;
            flex-direction: row;">
    <div>Prize Id:<\/div>
    <div>~guidprizeid~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Place:<\/div>
    <div>~intplace~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Int Prize Type:<\/div>
    <div>~intprizetype~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>VC Prize Type:<\/div>
    <div>~vcprizetype~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Int Prize Status:<\/div>
    <div>~intprizestatus~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>VC Prize Status:<\/div>
    <div>~vcprizestatus~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Prize Description:<\/div>
    <div>~vcprizedescription~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Prize Value:<\/div>
    <div>~decprizevalue~<\/div>
<\/div>
<div style="display: flex;
            flex-direction: row;">
    <div>Date Drawn:<\/div>
    <div>~dtdraw~<\/div>
<\/div>`