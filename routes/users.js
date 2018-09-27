var express = require('express');
var router = express.Router();

// 引入连接数据库模块
const connection = require('./conn');

// 调用连接方法
connection.connect(() => {
  console.log('与数据库admin连接成功...')
});

/* 接收添加用户账号的请求 */
router.post('/userAdd', (req, res) => {
  // 接收前端发送给后端的账号数据
  let { username, password, groups } = req.body;
  // console.log('接收到的数据：',username, password ,groups);  打印测试接收的数据的有效性

  // 构造sql语句 
  const sqlStr = 'insert into users(username, password, groups) value (?,?,?)';
  // 接收到的数据参数
  const sqlParams = [username, password, groups];

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


/* 接收显示所有用户账号数据的请求 */
router.get('/userList', (req, res) => {
  // 构造sql语句(查询所有用户账号)
  const sqlStr = 'select * from users order by ctime desc';

  // 后台执行构造的sql语句(查询所有用户账号数据)
  connection.query(sqlStr, (err, data) => {
    // 如果有错，抛出错误
    if (err) {
      throw err;
    } else {  // 否则  直接把查询的所有数据  响应给前端
      res.send(data);
    }
  });
});



/* 接收单条删除的请求 */
router.get('/userDelOne', (req, res) => {
  // 接收前端发送过来要删除的数据  对应的id
  // let id = req.query;
  let { id } = req.query;

  // 构造根据接收的id  删除指定数据信息的 sql语句
  const sqlStr = `delete from users where id = ${id}`;
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

/*  */
/*  */
/*  */
/*  */

module.exports = router;
