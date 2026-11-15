# Design QA

final result: blocked

Source visual truth: three user-supplied mobile screenshots in the current conversation (home, transaction actions, receipt). Screenshots include personal financial information; they were not copied into the deliverable.

Implementation evidence: Safari screenshots captured in this conversation showing the local index.html home state and receipt/sample-shop state. The page renders as a centered 430 CSS px app. Native screenshots are 2880 x 1580; app width is 860 physical px (2x). Source is 588 x 1280; source density and its precise CSS viewport have not been verified. No valid same-viewport combined comparison has been produced; exact visual acceptance remains blocked.

## Findings and comparison history

- P1: Initial transformed card overlapped the all-cards control and clipped horizontally. Reduced card stage to 82%, adjusted perspective to 1200px and rotateX to 68 degrees. Later Safari screenshot shows all-cards text and side margins visible.
- P2: More-tab icon initially missing from the upstream collection. Downloaded and bundled the supported circles-four-fill Phosphor asset. Later Safari screenshot shows the four-circle menu icon.
- P2: User-agent hidden attribute was overridden by primary-button display CSS. Added [hidden] display:none!important.
- P2: Back from receipt overwrote the detail return route. Fixed and verified with the state test.
- Remaining P1 fidelity: source card is current Visa artwork; bundled public image is an older Mastercard artwork. Library icons approximate original icons. These must not be described as exact reproductions.

## Required fidelity surfaces

- Typography: system Apple font stack, large balance and Ukrainian text; receipt uses Arial. Family, wrapping and exact weights not compared at the source viewport.
- Spacing/layout: source mobile composition reproduced (top actions, balance, perspective card, all cards, three payment actions, operations panel, pill bottom navigation). Card overlap corrected. Exact vertical rhythm at 393 CSS px remains unverified.
- Colors: navy-to-blue background, charcoal panels, white text, red active state and CTA, green income. Inferred from screenshot, not pixel sampled.
- Images/assets: public source card image bundled locally; Phosphor source icons bundled locally. Card differs from selected reference. Avatar intentionally uses fictional icon, not the source user's photo. PNG installation icon still uses the previous Pocket symbol; SVG has a cat and explicit mock text.
- Copy/content: fictional sample data replaces all private data in the references. Persistent mock marking, visible receipt watermark and simulation copy are intentional constraints.

## Browser verification

Safari local file loaded successfully with JS and local images. Tested home -> transaction -> split dialog, changed participants from 2 to 3 and observed 600 UAH per participant. Opened receipt and confirmed watermark. Opened profile and saved successfully. Browser developer-console errors were not inspected. Physical phone install, file upload/download, restore and offline flow remain unverified.

## Follow-up

Complete a normalized same-viewport comparison with the original screenshot before claiming 1:1. Obtain matching card artwork and exact icon assets. Verify installation icon, physical-phone viewport, file and offline flows.

## Second refinement

Normalized application width to 393 CSS px. Replaced top-origin perspective with center-origin perspective(850px) rotateX(60deg), 79% card stage width; screenshot shows full card with side margins and a visible all-cards control. Retuned header, balance, action spacing and bottom navigation to the supplied screenshot proportions. Added 240–310 ms route entrance motion, 300 ms modal entrance, press feedback and reduced-motion support. Safari navigation home -> history -> details succeeds after changes. Exact original artwork and a normalized combined comparison remain outstanding; final result stays blocked for a claim of 1:1 fidelity.


## 14.11.2026 — окрема адмінка та референси відео

Перевірено `qa/functional.js` в окремому контексті Chromium без зміни користувацького сховища: баланс, кешбек, операція з логотипом, завантаження вкладення й відкриття з операції, перевірка недостатнього балансу й повторна спроба, поповнення Банки зі списанням із картки, перевертання й блокування картки, зміна Банки, створення депозиту, контакту й шаблону, збереження після перезавантаження. Усі перевірки пройшли, помилок JavaScript немає.

Візуально переглянуто головний екран, налаштування й зворот картки, накопичення, адмінку 1440 і 393 px. Перевірено відсутність горизонтального переповнення клієнта при 320 px. Рух і safe-area на фізичному iPhone не перевірено. Скриншоти збережено в `qa/`.

Механічний детектор запускався один раз. Попередження про білий фон компактного демо-позначення є статичним хибним визначенням: реальний фон темний; позначенню також надано темний підклад. Контраст кнопок форм збільшено темнішим червоним фоном. Червоний стан нижніх вкладок збережено за референсом.


## Спільне серверне збереження та уточнена анімація — збірка 11

Дані перенесено з окремих браузерних IndexedDB до атомарно записуваного `data/state.json`. Початкові приклади винесено в окремий файл і явну дію адмінки. Чинна база користувача під час тестів не засівалася: сценарії працювали через порт 8091 та `qa/test-data`.

Послідовні перевірки основних функцій, жестів і нових екранів пройшли без помилок JavaScript. Окремо підтверджено: справжня анімація на натискання; видалення шару після завершення; нерухомий сірий контейнер; окремі блоки доходів/витрат; великі суми у межах блоків; збереження й конфлікти між незалежними контекстами через localhost/127.0.0.1; PDF-перегляд із маркуванням; справжня ZIP/XML-структура XLSX. Перезапуск сервера залишив SHA-256 тестової бази незмінним.

Фінальний перегляд охопив картку у проміжному стані, каталог, гардероб і кешбек. Виправлено колізію CSS-класу cashback, через яку кореневий контейнер успадковував display:flex і обрізав елементи. Підібрано локальний шрифт Inter, вилучено потрапляння системного індикатора iPhone в одну мініатюру нагороди, додано нижній градієнт затемнення.

Статичний детектор повідомив про контраст компактного демо-позначення на обчисленому сірому фоні; фактичне позначення має власний темний підклад. Відповідність всіх станів 1:1 на фізичному телефоні не заявляється.


## Збірка 12 — стабільні контейнери й керована статистика

Видалено дубльовані реалізації гортання, створення копій сторінки та переміщення home-content. Поточний механізм змінює лише transform треку карток і непрозорість шару градієнта. Баланс і операції оновлюються в тих самих DOM-контейнерах, без очікування мережі перед відгуком інтерфейсу. Прибрано загальний translate з paint(), що накладався на відкриття картки. У перехідних знімках більше немає дубльованих id.

Статистика отримала спільний механізм перетягування для миші/дотику, фізичну зупинку, перехоплення, стрілки клавіатури та горизонтальне колесо. Категорії оновлюються після завершення переходу. При зміні даних суми перераховуються на нерухомих текстових якорях. Обрізаний значок повідомлень замінено цілісним SVG; уточнено стрілки, капітал і метрики.

qa/motion-v12.js: пройдено 18 перевірок. Шість контейнерів не змінюють x/y при drag; немає swipe-preview; картки рухаються; статистика реагує під час жесту й точно зупиняється; відкриття картки не додає translate до екрана; reduced-motion працює; JavaScript-помилок немає. qa/statistics-count-v12.js: у 28 кадрах підтверджено анімовану зміну суми, нерухомість її якоря й відсутність переповнення. Механічний детектор для змінених файлів повернув порожній список.

Основна база користувача не змінювалася цими тестами. Всі записи сценаріїв виконувалися через порт 8091.
