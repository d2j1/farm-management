import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguageStore } from '../utils/languageStore';

export const useAgriWeather = () => {
    const t = useLanguageStore((state) => state.t);
    const languageCode = useLanguageStore((state) => state.languageCode);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setLoading(true);
                let lat = 28.6139; // Default to New Delhi
                let lon = 77.2090;
                let userCity = 'Local Area';

                // 1. Get location via IP (no permissions needed) using more reliable ipinfo.io
                try {
                    const locRes = await axios.get('https://ipinfo.io/json');
                    if (locRes.data && locRes.data.loc) {
                        const locParts = locRes.data.loc.split(',');
                        lat = parseFloat(locParts[0]) || lat;
                        lon = parseFloat(locParts[1]) || lon;
                        userCity = locRes.data.city || userCity;
                    }
                } catch (locErr) {
                    console.log('IP Location failed, using default coordinates', locErr.message);
                }

                // 2. Get Weather via Open-Meteo
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&hourly=soil_temperature_0_to_7cm,soil_moisture_0_to_7cm&daily=et0_fao_evapotranspiration&timezone=auto`;

                const weatherRes = await axios.get(weatherUrl);
                const cw = weatherRes.data.current;
                const hw = weatherRes.data.hourly;
                const dw = weatherRes.data.daily;

                const currentHourIndex = new Date().getHours();

                const weatherData = {
                    city: userCity === 'Local Area' ? t('localArea') : userCity,
                    temperature: Math.round(cw.temperature_2m || 0),
                    humidity: cw.relative_humidity_2m || 0,
                    windSpeed: Math.round(cw.wind_speed_10m || 0),
                    conditionCode: cw.weather_code,
                    soilTemperature: Math.round(hw?.soil_temperature_0_to_7cm?.[currentHourIndex] || 0),
                    soilMoisture: Math.round((hw?.soil_moisture_0_to_7cm?.[currentHourIndex] || 0) * 100),
                    et0: parseFloat(dw?.et0_fao_evapotranspiration?.[0] || 0).toFixed(1),
                    isSunny: cw.weather_code <= 3,
                    isDay: cw.is_day !== undefined ? cw.is_day === 1 : (currentHourIndex >= 6 && currentHourIndex < 19),
                };

                // Add translated fields on the fly instead of hardcoded
                weatherData.cityDisplay = userCity === 'Local Area' ? 'localArea' : userCity;

                setData(weatherData);
            } catch (err) {
                console.error('Weather Fetch Error', err);
                setError(err.message || 'Failed to fetch weather data');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    // Translate data before returning
    const translatedData = data ? {
        ...data,
        city: data.cityDisplay === 'localArea' ? t('localArea') : data.city,
        condition: t(`weather_${data.conditionCode}`) !== `weather_${data.conditionCode}` ? t(`weather_${data.conditionCode}`) : t('unknownWeather'),
    } : null;

    return { data: translatedData, loading, error };
};
