//API_yandex_games for Unity
//Developed by Oleg Demianov


let ysdk;
let gameLangTld;
let gameLang;
let deviceType;
let player;
let payments;
let lb; //Leaderboads
let playerscore;
let isPlayerAuth;
isPlayerAuth = false;
let payload;


let opt = { screen: { fullscreen: false } };


// Yandex Games SDK вызов
  (function (d) {
    var t = d.getElementsByTagName('script')[0];
    var s = d.createElement('script');
    s.src = 'https://yandex.ru/games/sdk/v2';
    s.async = true;
    t.parentNode.insertBefore(s, t);
    s.onload = initSDK;
  })(document);


//Init SDK
function initSDK() {
    YaGames
        .init(opt)
        .then(ysdk_ => {
            ysdk = ysdk_;
            ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onClose: wasShown => {
                        console.info('First close')
                    }
                }
            });
        })
        .then(() => {
            gameLangTld = ysdk.environment.i18n.tld;
            gameLang = ysdk.environment.i18n.lang;
            console.log('!!!HTML: Lang.init');
            console.log(gameLangTld);
            console.log(gameLang);
            //changePolicyAndSupportText();

        })
        .then(() => {
            payload = ysdk.environment.payload;
            console.log('!!!HTML: payload.init');
            console.log(payload);
        })
        .then(() => {
            deviceType = ysdk.deviceInfo.type;
            console.log('!!!HTML: Device.info');
            console.log(deviceType);
             //Показываем баннеры внизу страницы
            //showBannerBottomAds();
        });



};


//Запрашиваем отзыв
function GetReviewRequest() {
    ysdk.feedback.canReview()
        .then(({ value, reason }) => {
            if (value) {
                ysdk.feedback.requestReview()
                    .then(({ feedbackSent }) => {
                        console.log(feedbackSent);
                    })
            } else {
                console.log(reason)
                //Если показать окно запроса отзыва не удалось - показываем рекламу
                doShowAds();
            }
        })
}


//Проверяем язык устойства
function doCheckLangFromHTML() {
    console.log('!!!Lang.function');
    console.log(gameLangTld);
    console.log(gameLang);

    unityGame.SendMessage('GetLocalization', 'reciveLocalizationCodeFromHTML', gameLang);
}


//Проверяем параметр Payload - передача пераметров через командную строку (например переход на произвольный уровень)
function doCheckPayloadFromHTML() {
    console.log('!!!payload.function');
    console.log(payload);

    unityGame.SendMessage('HtmlGameManager', 'recievedPayloadFromHTML', payload);
}


//Проверяем тип устройства (Десктоп / Мобильник / ТВ)
function doCheckDeviceTypeFromHTML() {
    console.log('!!!DeviceType.function');
    console.log(deviceType);

    //Отправляем запрос об устройстве в Unity
    unityGame.SendMessage('GetDeviceType', 'reciveDeviceTypeCodeFromHTML', deviceType);
}

//Проверяем тип устройства (Десктоп / Мобильник / ТВ)
function doShowBottomBanner() {
    //Показываем баннеры внизу страницы
    showBannerBottomAds();
}


////////////////////////////////////////////////////////////////////////////////////////////////
///Пользователь
////////////////////////////////////////////////////////////////////////////////////////////////


//Проверяем авторизован Пользователь или нет
function auth() {
    initPlayer().then(() => {
        console.log('!!!HTML: Player AUTH');
        isPlayerAuth = true;
        getUser();
    }).catch(err => {
        //openAuthDialog();
        console.log('!!!HTML: Player NOT auth');
        isPlayerAuth = false;

    });
}

//Открытие окна авторизации
function openAuthDialog() {
    console.log('!!!HTML: Open Auth dialog');
    ysdk.auth.openAuthDialog()
        .then(() => {
            window.focus();
            auth();
        });

}

//Инициаализация пользователя
function initPlayer() {
    console.log('!!!HTML: InitPlayer or show dialog for Avatar and UserName')
    return ysdk.getPlayer().then(_player => {
        console.log('!!!HTML: InitPlayer SUCCESSFULL');
        player = _player;
    });
}

//Получение данных пользователя
function getUser() {
    console.log('!!!HTML: try to get user Name');
    var data = player.getName();
    //TODO настроить правильный callback для Unity
    unityGame.SendMessage('YandexSDK', 'AuthenticateSuccess', data);
    console.log('!!!HTML: getName done');


}


////////////////////////////////////////////////////////////////////////////////////////////////
///_end Пользователь

////////////////////////////////////////////////////////////////////////////////////////////////
//Загрузка и сохранение данных пользователя
////////////////////////////////////////////////////////////////////////////////////////////////

//Получение данных
function getUserData() {
    player.getData().then(stats => {
        console.log('!!!HTML: Data is getting');
        console.log(JSON.stringify(stats));
        //TODO настроить правильный callback для Unity
        unityGame.SendMessage('YandexSDK', 'DataGetting', JSON.stringify(stats));
    });
}

//Сохранение данных
function setUserData(_data) {
    console.log('!!!HTML: Try Save');
    console.log(_data);
    player.setData({ data: _data }).then(() => {
        console.log('!!!HTML: saved');
    }).catch(() => { console.log('!!!HTML: unsaved') });
}
////////////////////////////////////////////////////////////////////////////////////////////////
//end_Загрузка и сохранение данных пользователя


////////////////////////////////////////////////////////////////////////////////////////////////
//Leaderboads
////////////////////////////////////////////////////////////////////////////////////////////////

//Инициаализация Leaderboads
function GetLeaderBoard() {
    ysdk.getLeaderboards().then(_lb => lb = _lb);
}


//Сброс данных пользователя
function ResetLeaderBoardPlayerScore(score) {
    ysdk.getLeaderboards()
        .then(lb => {
            lb.setLeaderboardScore('records', score);
            console.log('!!!HTML: write user score to Leaderboads');
            console.log(score);
        });
}



// records - название соревновательной таблицы
// - Забираем очки из таблицы
// - Если в таблице меньше чем текущий рекорд - перезаписываем
function SetLeaderBoard(score) {

    if (isPlayerAuth == true) {
        //Проверяем текущий уровень очков на сервере   
        ysdk.getLeaderboards()
            .then(lb => lb.getLeaderboardPlayerEntry('records'))
            .then(result => {

                playerscore = result.score;
                console.log('!!!HTML: result');
                console.log(result);
                console.log('!!!HTML: playerscore');
                console.log(playerscore);

                //Если текущие очки больше, чем на сервере то записываем результат
                if (score > playerscore) {
                    ysdk.getLeaderboards()
                        .then(lb => {
                            lb.setLeaderboardScore('records', score);
                            console.log('!!!HTML: write TOP user score to Leaderboads');
                            console.log(score);

                        })
                        .then(() => {
                            console.log('!!!HTML: show leaderboard after set TOP score');
                            // Показываем таблицу лидеров
                            GetLeaderBoardEntries();
                            return;

                        });


                } else {
                    console.log('!!!HTML: show leaderboard NO SCORE UPDATE');
                    // Показываем таблицу лидеров
                    GetLeaderBoardEntries();

                }



            })
            .catch(err => {
                if (err.code === 'LEADERBOARD_PLAYER_NOT_PRESENT') {
                    playerscore = 0;
                    // Срабатывает, если у игрока нет записи в соревновательной таблице
                    console.log('!!!HTML: no player data in Leaderboads');
                    // Записываем в таблицу очки
                    console.log('!!!HTML: try to write user score to Leaderboads');
                    ResetLeaderBoardPlayerScore(score);
                    // Показываем таблицу лидеров
                    console.log('!!!HTML: show leaderboard after adding score to Leaderboads');
                    GetLeaderBoardEntries();
                }
            });
    } else {
        console.log('!!!HTML: player not auth and we cannot show Leaderboads');


    }

}




//Получаем данные 
function GetLeaderBoardEntries() {
    ysdk.getLeaderboards()
        .then(lb => {
            lb.getLeaderboardEntries('records', { quantityTop: 10, includeUser: true, quantityAround: 3 })
            .then(result => {

                if (result.entries) {
                    for (var i = 0; i < result.entries.length; i++) {
                        var entry = result.entries[i];
                        entry.player.getAvatarSrc = entry.player.getAvatarSrc('large');
                        //entry.player.getAvatarSrcSet = entry.player.getAvatarSrcSet('large');
                    }
                }
                console.log(result);


             //TODO прописать правильный метод callback для Unity

                unityGame.SendMessage('YandexGameManager', 'LeaderBoardAddEntri', JSON.stringify(result));
            });
        });
}

////////////////////////////////////////////////////////////////////////////////////////////////
//end_Leaderboads

////////////////////////////////////////////////////////////////////////////////////////////////
//Реклама
////////////////////////////////////////////////////////////////////////////////////////////////

//Межэкранная реклама
function doShowAds() {
    let commonCounter = 0;
    {
        let counter = 0;

        function getCallback(callbackName) {
            return () => {
                counter += 1;
                commonCounter += 1;

                if (commonCounter % 3 === 0) {
                    throw new Error(`Test error in ${callbackName}, everything okey, it should not abort other code execution`);
                }

                console.info(`showFullscreenAdv; callback ${callbackName}; ${counter} call`);
            }
        }

        function makeSomethingImportant() {
            window.focus(); //возвращаем фокусн на iframe после показа рекламы
            //console.info('It\'s very important \'console.info\'');
        }

        if (ysdk) {
            ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onClose: makeSomethingImportant,
                    onOpen: getCallback('onOpen'),
                    onError: function (error) {
                        console.error(error);
                    },
                    onOffline: getCallback('onOffline')
                }
            });
        } else {
            makeSomethingImportant();
        }

    }
};

//Rewarded реклама
function doShowRewardedVideo() {
    let commonCounter = 0;
    {
        let counter = 0;

        function getCallback(callbackName) {
            return () => {
                counter += 1;
                commonCounter += 1;

                if (commonCounter % 3 === 0) {
                    throw new Error(`Test error in ${callbackName}, everything okey, it should not abort other code execution`);
                }

                console.info(`showRewardedAds; callback ${callbackName}; ${counter} call`);
            }
        }

        function makeSomethingImportant() {            
            window.focus(); //возвращаем фокусн на iframe после показа рекламы
        }



        if (ysdk) {
            ysdk.adv.showRewardedVideo({
                callbacks: {
                    onOpen: () => {
                        unityGame.SendMessage('UIManager', 'OnRewardedOpen');
                        console.log('Video ad open.');
                    },
                    onRewarded: () => {
                        unityGame.SendMessage('UIManager', 'OnRewarded');
                        console.log('Rewarded!');
                    },
                    onClose: () => {
                        window.focus(); //возвращаем фокусн на iframe после показа рекламы
                        unityGame.SendMessage('UIManager', 'OnRewardedClose');
                        console.log('Video ad closed.');
                    },
                    onError: (e) => {
                        unityGame.SendMessage('UIManager', 'OnRewardedError');
                        console.log('Error while open video ad:', e);
                    }
                }
            });
        } else {
            makeSomethingImportant();
        }

    }
};


////////////////////////////////////////////////////////////////////////////////////////////////
//end_Реклама

