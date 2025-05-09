-----------------
--ITEMS--

SELECT
ITEM.ID AS ITEM_NUM,
ITEM.DESCRIPT AS ITEM_NAME,
TYPECODES.DESCRIPT AS TYPE,
SERIES.DESCRIPT AS SERIES_NAME,
ITEM.ORDERNUM AS ORDERNUM, --FIGURE OUT HOW TO MAKE FLOAT ROUNT TO ONE DECIMAL
ITEM.FIRSTRELEASE,
ITEM.LENGTH, --FIGURE OUT HOW TO BEST DISPLAY LENGTH AS TIME WHERE UOM IS TIME
UOM.DESCRIPT

FROM ITEM
LEFT OUTER JOIN TYPECODES ON (ITEM.TYPEID = TYPECODES.ID)
LEFT OUTER JOIN SERIES ON (ITEM.SERIESID = SERIES.ID)
LEFT OUTER JOIN UOM ON (ITEM.UOMID = UOM.ID)

---------------
--BOOKS--

SELECT
ITEM.ID AS ITEM_NUM,
ITEM.DESCRIPT AS ITEM_NAME,
PEOPLE.FIRSTNAME || ' ' || PEOPLE.LASTNAME AS AUTHOR,
SERIES.DESCRIPT AS SERIES_NAME,
ITEM.ORDERNUM AS ORDERNUM, --FIGURE OUT HOW TO MAKE FLOAT ROUNT TO ONE DECIMAL
ITEM.FIRSTRELEASE,
ITEM.LENGTH, --FIGURE OUT HOW TO BEST DISPLAY LENGTH AS TIME WHERE UOM IS TIME
UOM.DESCRIPT,
LIST(GENRE.DESCRIPT) AS GENRE

FROM ITEM
LEFT OUTER JOIN TYPECODES ON (ITEM.TYPEID = TYPECODES.ID)
LEFT OUTER JOIN SERIES ON (ITEM.SERIESID = SERIES.ID)
LEFT OUTER JOIN UOM ON (ITEM.UOMID = UOM.ID)
LEFT OUTER JOIN AUTHOR ON (ITEM.ID = AUTHOR.ITEMID)
LEFT OUTER JOIN PEOPLE ON (AUTHOR.PEOPLEID = PEOPLE.ID)
LEFT OUTER JOIN ITEMGENRE ON (ITEM.ID = ITEMGENRE.ITEMID)
LEFT OUTER JOIN GENRE ON (ITEMGENRE.GENREID = GENRE.ID)

WHERE ITEM.TYPEID = 1

GROUP BY 1,2,3,4,5,6,7,8

--------------
--MOVIES--

SELECT
ITEM.ID AS ITEM_NUM,
ITEM.DESCRIPT AS ITEM_NAME,
SERIES.DESCRIPT AS SERIES_NAME,
ITEM.ORDERNUM AS ORDERNUM, --FIGURE OUT HOW TO MAKE FLOAT ROUNT TO ONE DECIMAL
ITEM.FIRSTRELEASE,
ITEM.LENGTH, --FIGURE OUT HOW TO BEST DISPLAY LENGTH AS TIME WHERE UOM IS TIME
UOM.DESCRIPT,
LIST(GENRE.DESCRIPT) AS GENRE,
ENTITY.DESCRIPT AS PLATFORM

FROM ITEM
LEFT OUTER JOIN TYPECODES ON (ITEM.TYPEID = TYPECODES.ID)
LEFT OUTER JOIN SERIES ON (ITEM.SERIESID = SERIES.ID)
LEFT OUTER JOIN UOM ON (ITEM.UOMID = UOM.ID)
LEFT OUTER JOIN ITEMGENRE ON (ITEM.ID = ITEMGENRE.ITEMID)
LEFT OUTER JOIN GENRE ON (ITEMGENRE.GENREID = GENRE.ID)
LEFT OUTER JOIN PLATFORM ON (ITEM.ID = PLATFORM.ITEMID)
LEFT OUTER JOIN ENTITY ON (PLATFORM.ENTITYID = ENTITY.ID)

WHERE ITEM.TYPEID = 2

GROUP BY 1,2,3,4,5,6,7,9

-----------
