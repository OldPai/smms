var express = require('express');
var router = express.Router();

// 引入连接数据库模块
const connection = require('./conn');

// 调用连接方法
connection.connect(() => {
  console.log('与数据库admin连接成功...')
});


/* 登录请求：检查用户名和密码是否正确 */
router.post('/checkLogin', (req, res) => {
  // 接收用户名和密码
  let { username, password } = req.body;

  // 构造sql语句 查询接收的用户名和密码是否存在  （用户名和密码是且的关系）
  const sqlStr = `select * from users where username='${username}' and password='${password}'`;
  // console.log(sqlStr);
  // 执行sql语句（根据前端发送过来的数据查询用户名和密码是否存在）
  connection.query(sqlStr, (err, data) => {
    if (err) {
      // 如果有错 抛出错误
      throw err
    } else {
      // 判断：如果存在，返回成功的数据对象
      if (data.length) {
        console.log(data);
        // 登录成功，设置cookie (在res.send()之前设置)
        res.cookie('username', data[0].username);
        // res.cookie('password', data[0].password);
        res.cookie('groups', data[0].groups);
        res.cookie('userId', data[0].id);

        // 返回成功的数据对象
        res.send({'errcod':1,'msg':'登录成功！！！'});
      } else {
        // 否则  用户不存在  返回失败的数据对象
        res.send({'errcod':0,'msg':'请检查用户名或密码是否正确！！！'});
      }
    }
  });
});

/* 检查用户是否已经登录 */
router.get('/checkIsLogin', (req, res) => {
  // 从浏览器获取cookie（看一下有没有，如果有 就是登录过的 如果没有 就是直接进来的没有登录的）
  // console.log('用户名',req.cookies.username);

  // 从浏览器获取cookie
  let username = req.cookies.username
  // 如果存在 随便响应一些信息（不影响用户操作）
  if (username) {
    res.send('console.log("")');
  } else {
    // 如果不存在 就是没有登录  弹出对应提示  并跳转到登录页面
    res.send('alert("请登录以后再操作..."); location.href="./login.html";');
  }
});

/* 退出登录 */
router.get('/logout', (req, res) => {
  // 清除浏览器cookie
  res.clearCookie('username');
  // res.clearCookie('password');
  res.clearCookie('groups');
  res.clearCookie('userId');

  // 弹出对应提示  跳转到登录页面
  res.send('<script>alert("退出成功！！！"); location.href="http://localhost:2345/login.html"</script>');
});



/* 验证旧密码是否正确 */
router.get('/checkoldpwd', (req, res) => {
  // 接收前端发送过来的旧密码
  let { oldPwd } = req.query;

  // 从cookie里面拿到id
  let id = req.cookies.userId;
  // 构造sql语句
  let sqlStr = `select * from users where id=${id}`;
  // console.log(sqlStr);
  // 执行sql语句
  connection.query(sqlStr, (err, data) => {
    if (err) {
      throw err;
    } else {
      // console.log('接收到的数据：',data);
      // console.log('密码：',data[0].password);

      // 判断前端发送过来的密码是否与旧密码相同   
      if (oldPwd === data[0].password) {
        res.send({'errcode':1,'msg':'旧密码输入正确！！'});
      } else {
        res.send({'errcode':0, 'msg':'旧密码输入错误！！'});
      }
    }
  });
});

/* 接收修改新密码的请求并保存 */
router.post('/savenewpwd', (req, res ) => {
  // 接收前端发送过来修改的新密码
  let { newPwd } = req.body;
  // 从cookie获取id
  let id = req.cookies.userId;

  // 构造sql语句(根据id查找数据，修改密码)
  const sqlStr = `update users set password='${newPwd}' where id=${id}`;
  console.log(sqlStr);
  // 执行构造的sql语句 ：修改密码
  connection.query(sqlStr, (err, data) => {
    if (err) {
      // 如果有错  抛出错误
      throw err;
    } else {
      // 如果成功  清除cookie
      res.clearCookie('username');
      res.clearCookie('userId');
      res.clearCookie('groups');

      // 发送数据给前端
      res.send({'errcode':1,'msg':'密码修改成功！'});
    }
  });
});
/*  */
/*  */
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
  // 接收前端发送过来的参数 pageSize  currentPage
  let { pageSize, currentPage } = req.query;
  // console.log('从前端接收到的数据：',pageSize, currentPage);

  // 构造sql语句(查询所有用户账号)
  let sqlStr = 'select * from users';

  // 后台执行构造的sql语句(查询所有用户账号数据)
  connection.query(sqlStr, (err, data) => {
    // 如果有错，抛出错误
    if (err) {
      throw err;
    } else {  
      // 计算数据总条数
      let totalcount = data.length;
      // 计算每页跳过多少条
      let n = (currentPage - 1)*pageSize;

      // 构造sql语句  按条件查询  对应页码的数据
      sqlStr += ` order by ctime desc limit ${n}, ${pageSize}`;
      console.log('构造的sql语句：',sqlStr);
      // 执行sql语句
      connection.query(sqlStr, (err, data) => {
        if (err) {
          throw err;
        } else {
          // 把数据的总条数 和 当前页码对应的数据 一起发送给前端
          res.send({'totalcount':totalcount,'pageData':data});
        }
      });
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


/* 接收修改用户账号数据的请求：把原来的数据查询出来，返回给前端 */
router.get('/userEdit', (req, res) => {
  // 接收前端传过来的id
  let { id } = req.query;
  // console.log(id);

  // 根据接收到的id构造sql语句（在数据库里查询这条数据）
  const sqlStr = `select * from users where id=${id}`;
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


/* 接收修改用户账号数据的请求：把修改后的数据保存会mysql数据库 并覆盖原来的数据 */
router.post('/saveEdit', (req, res) => {
  // 接收前端发送过来的数据
  let { username, password, groups, id } = req.body;

  // 构造sql语句（根据id  修改这条数据）
  const sqlStr = `update users set username='${username}',password='${password}',groups='${groups}' where id=${id}`;
  // console.log(sqlStr);
  // 执行修改用户数据的sql语句
  connection.query(sqlStr, (err, data) => {
    // 如果有错  抛出错误
    if (err) {
      throw err;
    } else {  // 否则  响应数据给前端
      // 判断: 如果受影响行数 > 1  就是修改成功   否则 就是修改失败
      if (data.affectedRows > 0) {
        // 响应修改成功的数据给前端
        res.send({ "errcode": 1, "msg": "修改成功！" });
      } else {
        // 响应修改失败的数据给前端
        res.send({ "errcode": 0, "msg": "修改失败！" });
      }
    }
  });
});


/* 接收批量删除的请求 （得到的是前端发送过来的一个要删除数据 id 组成的数组） */
router.post('/batchesDel', (req, res) => {
  // 接收前端选中的需要批量删除的数据的 id 
  let idArr = req.body['idArr[]'];

  // 构造sql语句：根据接收到的这些id  把这些被选中的数据全部删除
  const sqlStr = `delete from users where id in (${idArr})`;
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


/*  */
/*  */
/*  */
/*  */
/*  */
/*  */
/*  */
/*  */
/*  */
/*  */

module.exports = router;
