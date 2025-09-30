const axios = require('axios');

// Кэш для курсов валют (обновляется раз в 24 часа)
let ratesCache = null;
let lastUpdate = null;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

/**
 * Получить актуальные курсы валют
 */
async function getExchangeRates() {
  const now = Date.now();

  // Проверяем кэш
  if (ratesCache && lastUpdate && (now - lastUpdate < CACHE_DURATION)) {
    return ratesCache;
  }

  try {
    // Используем ExchangeRate-API (бесплатный, без ключа)
    const response = await axios.get('https://open.exchangerate-api.com/v6/latest/USD');

    if (response.data && response.data.rates) {
      ratesCache = response.data.rates;
      lastUpdate = now;
      console.log('Currency rates updated successfully');
      return ratesCache;
    }

    throw new Error('Invalid response from currency API');
  } catch (error) {
    console.error('Error fetching currency rates:', error.message);

    // Если есть старый кэш, используем его
    if (ratesCache) {
      console.log('Using cached rates due to API error');
      return ratesCache;
    }

    // Фоллбек с фиксированными курсами
    console.log('Using fallback rates');
    return {
      USD: 1,
      EUR: 0.92,
      RUB: 92.5,
      GBP: 0.79,
      JPY: 149.5,
      CNY: 7.24
    };
  }
}

/**
 * Конвертировать сумму из одной валюты в другую
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates();

  // Конвертируем через USD как базовую валюту
  const amountInUSD = fromCurrency === 'USD'
    ? amount
    : amount / rates[fromCurrency];

  const convertedAmount = toCurrency === 'USD'
    ? amountInUSD
    : amountInUSD * rates[toCurrency];

  return parseFloat(convertedAmount.toFixed(2));
}

/**
 * Конвертировать подписки в нужную валюту
 */
async function convertSubscriptions(subscriptions, targetCurrency) {
  const converted = await Promise.all(
    subscriptions.map(async (sub) => {
      const convertedPrice = await convertCurrency(
        parseFloat(sub.price),
        sub.currency,
        targetCurrency
      );

      return {
        ...sub,
        originalPrice: sub.price,
        originalCurrency: sub.currency,
        convertedPrice,
        convertedCurrency: targetCurrency
      };
    })
  );

  return converted;
}

/**
 * Получить суммы по всем валютам
 */
function getTotalsByCurrency(subscriptions) {
  const totals = {};

  subscriptions.forEach(sub => {
    const currency = sub.currency || 'RUB';
    let monthlyAmount = parseFloat(sub.price);

    // Конвертируем в месячную стоимость
    if (sub.cycle.includes('Year')) {
      monthlyAmount = monthlyAmount / 12;
    } else if (sub.cycle.includes('Week')) {
      monthlyAmount = monthlyAmount * 4;
    } else if (sub.cycle.includes('3 Month')) {
      monthlyAmount = monthlyAmount / 3;
    } else if (sub.cycle.includes('6 Month')) {
      monthlyAmount = monthlyAmount / 6;
    }

    totals[currency] = (totals[currency] || 0) + monthlyAmount;
  });

  // Округляем до 2 знаков
  Object.keys(totals).forEach(currency => {
    totals[currency] = parseFloat(totals[currency].toFixed(2));
  });

  return totals;
}

module.exports = {
  getExchangeRates,
  convertCurrency,
  convertSubscriptions,
  getTotalsByCurrency
};