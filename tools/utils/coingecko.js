const axios = require('axios').default;

module.exports = class Coingecko {

    static async price(token) {
        let price = 0
        
        await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`)
        .then(response => {
          price = response.data[token].usd;
        })
        .catch(error => {
          console.log(error);
        });
      
        return price;
    }

}
