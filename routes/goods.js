var express = require('express');
var router = express.Router();

// 引入连接数据库模块
const connection = require('./conn');

// 调用连接方法
connection.connect(() => {
    console.log('与admin数据库连接成功...');
});

/* 接收添加商品的请求 */
router.post('/goodsAdd', (req, res) => {
    // 接收前端发送给后端的账号数据
    let { cateName, barCode, goodsName, salePrice, marketPrice, costPrice, goodsNum, goodsWeight, unit, discount, promotion, goodsDesc } = req.body;

    // 构造sql语句 
    const sqlStr = 'insert into goods(cateName, barCode, goodsName, salePrice,marketPrice, costPrice, goodsNum, goodsWeight, unit, discount, promotion, goodsDesc) value (?,?,?,?,?,?,?,?,?,?,?,?)';
    // 接收到的数据参数
    const sqlParams = [cateName, barCode, goodsName, salePrice, marketPrice, costPrice, goodsNum, goodsWeight, unit, discount, promotion, goodsDesc];

    // 执行sql语句(往mysql数据库  插入数据-添加账号)
    connection.query(sqlStr, sqlParams, (err, data) => {
        // 如果有错  抛出错误
        if (err) {
            throw err;
        } else {
            // 否则 检查数据是否插入成功：如果受影响的行数 >0 就是插入成功
            // 判断 ：affectedRows 是否 >0 
            if (data.affectedRows > 0) {
                // 数据插入成功  响应一个成功的数据对象给前端
                res.send({ 'errcode': 1, 'msg': '添加成功！' })
            } else {
                // 否则 就是插入数据失败  响应一个失败的数据对象给前端
                res.send({ 'errcode': 0, 'msg': '添加失败！' })
            }
        }
    });
});

/* 接收显示所有商品列表的请求 */
router.get('/goodsList', (req, res) => {
    // 接收前端发送过来的参数 pageSize  currentPage
    let { pageSize, currentPage, searchCateName, searchKeyWord } = req.query;
    // console.log('从前端接收到的数据：',pageSize, currentPage);

    // 构造sql语句(查询所有用户账号)
    let sqlStr = 'select * from goods where 1=1';

    // 后台执行构造的sql语句(查询所有用户账号数据)
    connection.query(sqlStr, (err, data) => {
        // 如果有错，抛出错误
        if (err) {
            throw err;
        } else {
            // 计算数据总条数
            let totalcount = data.length;

            // 如果有分类名 就拼接上 分类的条件
            if (searchCateName !== '' && searchCateName != '全部') {
                sqlStr += ` and cateName='${searchCateName}'`;
            }

            // 如果有关键字 就按照关键字模糊查询
            if (searchKeyWord != '') {
                sqlStr += ` and (barCode like '%${searchKeyWord}%' or goodsName like '%${searchKeyWord}%')`
            }

            // 再次查询 重新计算数据总条数
            connection.query(sqlStr, (err, data) => {
                if (err) {
                    throw err;
                } else {
                    // 根据查询的结果 重新计算总条数
                    totalcount = data.length;
                }
            })

            // 计算每页跳过多少条
            let n = (currentPage - 1) * pageSize;

            // 构造sql语句  按条件查询  对应页码的数据
            sqlStr += ` order by ctime desc limit ${n}, ${pageSize}`;
            console.log('构造的sql语句：', sqlStr);
            // 执行sql语句
            connection.query(sqlStr, (err, data) => {
                if (err) {
                    throw err;
                } else {
                    // 把数据的总条数 和 当前页码对应的数据 一起发送给前端
                    res.send({ 'totalcount': totalcount, 'pageData': data });
                }
            });
        }
    });
});


/* 查询 */
// router.get('/search', (req, res) => {
//     // 接收查询关键字
//     let { searchCateName, searchKeyWord } = req.query;
//     console.log(searchCateName, searchKeyWord);
//     /* 
//       searchCateName可能获取的值：
//         空：  查所有分类
//         全部：查所有分类
//         分类名：  查这个分类下所有商品

//       searchKeyWord
//         空：  查所有条形码和商品下数据
//         写：  条形码或商品名称   查对应的条形码或商品名称（模糊查询）
//     */
//     // 构造sql语句
//     let sqlStr = 'select * from goods where 1=1';

//     // 如果有分类名 就拼接上 分类的条件
//     if (searchCateName !== '' && searchCateName != '全部') {
//         sqlStr += ` and cateName='${searchCateName}'`;
//     }

//     // 如果有关键字 就按照关键字模糊查询
//     if (searchKeyWord != '') {
//         sqlStr += ` and (barCode like '%${searchKeyWord}%' or goodsName like '%${searchKeyWord}%')`
//     }

//     console.log('拼接结果：', sqlStr)

//     // 执行sql
//     connection.query(sqlStr, (err, data) => {
//         if (err) {
//             throw err;
//         } else {
//             // 把查询结果 返回给前端
//             res.send(data);
//         }
//     })
// })


/* 接收单条删除的请求 */
router.get('/goodsDelOne', (req, res) => {
    // 接收前端发送过来要删除的数据  对应的id
    // let id = req.query;
    let { id } = req.query;

    // 构造根据接收的id  删除指定数据信息的 sql语句
    const sqlStr = `delete from goods where id = ${id}`;
    // 指向sql语句(根据id删除单条数据) 
    connection.query(sqlStr, (err, data) => {
        // 如果有错 抛出错误
        if (err) {
            throw err;
        } else {
            // 判断：如果受影响的行数 >0 ，返回给前端删除成功的数据对象
            if (data.affectedRows > 0) {
                res.send({ 'errcode': 1, 'msg': '删除成功！！' })
            } else {
                // 否则  返回给前端删除失败的数据对象
                res.send({ 'errcode': 0, 'msg': '删除失败！！' })
            }
        }
    })
});


/* 接收批量删除的请求 （得到的是前端发送过来的一个要删除数据 id 组成的数组） */
router.post('/batchesDel', (req, res) => {
    // 接收前端选中的需要批量删除的数据的 id 
    let idArr = req.body['idArr[]'];

    // 构造sql语句：根据接收到的这些id  把这些被选中的数据全部删除
    const sqlStr = `delete from goods where id in (${idArr})`;
    // console.log(sqlStr);

    // 执行构造的批量删除sql语句
    connection.query(sqlStr, (err, data) => {
        if (err) {
            throw err;
        } else {
            // 判断：如果受影响行数 > 0 （批量删除几个就是几行）就是删除成功  返回成功的数据对象
            if (data.affectedRows > 0) {
                res.send({ 'errcode': 1, 'msg': '批量删除成功！！' });
            } else {
                // 否则  就是批量删除失败  返回失败的数据对象
                res.send({ 'errcode': 0, 'msg': '批量删除失败！！' });
            }
        }
    });
});



/* 接收修改商品信息的请求：把原来的数据查询出来，返回给前端 */
router.get('/goodsEdit', (req, res) => {
    // 接收前端传过来的id
    let { id } = req.query;
    // console.log(id);

    // 根据接收到的id构造sql语句（在数据库里查询这条数据）
    const sqlStr = `select * from goods where id=${id}`;
    // 执行sql语句(用构造的sql语句在数据库里查询这条数据)
    connection.query(sqlStr, (err, data) => {
        // 如果有错  抛出错误
        if (err) {
            throw err;
        } else {
            // 否则  把根据id查询到的这条数据（要修改的数据）响应给前端
            res.send(data)
        }
    });
});


/* 接收修改商品信息的请求：把修改后的数据保存会mysql数据库 并覆盖原来的数据 */
// router.post('/saveEdit', (req, res) => {
//     // 接收前端发送过来的数据
//     let { cateName, barCode, goodsName, salePrice, marketPrice, costPrice, goodsNum, goodsWeight, unit, discount, promotion, goodsDesc, id } = req.body;

//     // 构造sql语句（根据id  修改这条数据）
//     const sqlStr = `update goods set cateName='${cateName}',barCode='${barCode}',goodsName='${goodsName}',salePrice='${salePrice}',marketPrice='${marketPrice}',costPrice='${costPrice}',goodsNum='${goodsNum}',goodsWeight='${goodsWeight}',unit='${unit}',discount='${discount}',promotion='${promotion}',goodsDesc='${goodsDesc}' where id=${id}`;
//     // console.log(sqlStr);
//     // 执行修改用户数据的sql语句
//     connection.query(sqlStr, (err, data) => {
//         // 如果有错  抛出错误
//         if (err) {
//             throw err;
//         } else {  // 否则  响应数据给前端
//             // 判断: 如果受影响行数 > 1  就是修改成功   否则 就是修改失败
//             if (data.affectedRows > 0) {
//                 // 响应修改成功的数据给前端
//                 res.send({ "errcode": 1, "msg": "修改成功！" });
//             } else {
//                 // 响应修改失败的数据给前端
//                 res.send({ "errcode": 0, "msg": "修改失败！" });
//             }
//         }
//     });
// });

module.exports = router;