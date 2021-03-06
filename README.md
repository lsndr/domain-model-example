Проект - простенькая читалка книг.

## Структура.

Папка library:<br>
__Application__ – логика приложения (application services)
<br />
__Database__ – репозитории, которые знают как хранить и восстанавливать агрегаты из бд
<br />
__Domain__ – предметная область aka domain model (агрегаты/сущности/value objects/domain services)

Папка shared содержит общий код для всех доменов


## Пример изменения стейта 1

Предметной логики в примере не много на самом деле. Поэтому тут больше инеграционных тестов, чем юнит.

Возьмем клонирование сессии:

Вызывается метод `SessionService.cloneSession` (юзкейс/логика приложения), где сначала проверяется есть ли нужная сессия в базе. Если есть, то клонировать не получится, так как в бд стоит unique constraint.

Если можем клонировать, то вызываем метод агрегата `Session.clone` (наша предметная область), контракт которого говорит нам, что нужно для клонирования (это агрегат Book, дата, id, userId пользователя). _(Сейчас у id и userId типы string, в идеале это должны быть Value Objects или хотя бы Opaque Types, иначе туда можно любой string подставить и это будет считаться соблюдением контракта, но на мой взгляд это не на всех проектах нужно иначе слишком много кода писать.)_

Для ответа мы собираем данные из агрегатов в DTO и возвращаем их.

В итоге за клонирование сессии у нас отвечает изолированная предметная область (`Session.clone`), которая хорошо тестируется юнит тестами.

На это пишутся следующие тесты:

* 1 юнит тест на `Session.clone`
* 1 юнит текст на `Session.create`
* 4 интеграционных теста на `SessionService.cloneSession` (проверка успешного выполнения с клонированием; проверка успешного выполнения без клонирования; пограничный тест на первый if; пограничный тест на второй if)

## Пример изменения стейта 2

Есть еще пример с перелистыванием страниц:

Вызываем `SessionService.openPage` (юзкейс/логика приложения), который затем вызывает `Session.setCurrentPage` (из предметной области).

Чтобы сформировать DTO мы еще делаем доп запрос в бд для получениях нужных данных и затем из этих данных и агрегата формируем ответ.

Тесты такие:

* 3 юнит теста на `Session.setCurrentPage` (два на if и третий на успешное выполнение)
* 3 интеграционных теста на `SessionService.openPage` (1 на успешное выполнение; 1 на первый if; на второй if не делаем, потому что покрыто юнит тестом; 1 на третий if)

## Чтение

Так как за стейтом следит domain model и все операции по модификации стейта идут через domain model, данные можно выбирать прямыми sql запросами не используя агрегаты. Это дает гибкость в оптимизации запросов. 

Если вдруг есть сложная read model или необходимо переиспользовать запросы, то можно использовать orm для выборок, писать свои gateway или что-то еще придумать.