const soap = require("soap");
const request = require("superagent");
const viesURL =
  "http://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl";
const hmrcURL =
  "https://api.service.hmrc.gov.uk/organisations/vat/check-vat-number/lookup";

const viesCheck = async (countryCode, vatNumber) => {
  const client = await soap.createClientAsync(viesURL);
  let result = await client.checkVatAsync({ countryCode, vatNumber });
  if (!result || !result[0] || !result[0].valid) {
    return { valid: false };
  } else {
    const address = result[0].address
      .split("\n")
      .reduce(
        (acc, line, index) => ({ ...acc, [`line${index + 1}`]: line.trim() }),
        {}
      );
    return {
      name: result[0].name,
      address,
      valid: result[0].valid,
    };
  }
};

const hmrcCheck = async (vatNumber) => {
  const res = await request.get(`${hmrcURL}/${vatNumber}`);
  if (res.notFound || !res.body || !res.body.target) {
    return { valid: false };
  } else {
    return {
      name: res.body.target.name,
      address: res.body.target.address,
      valid: true,
    };
  }
};

module.exports = async (countryCode, vatNumber) =>
  countryCode === "GB"
    ? hmrcCheck(vatNumber)
    : viesCheck(countryCode, vatNumber);
