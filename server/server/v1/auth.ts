import Koa from 'koa';
import Router from 'koa-router';
import Bodyparser from 'koa-bodyparser';
import Cookie from 'koa-cookie';
import dotenv from 'dotenv';
import axios from 'axios';

const router = new Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

dotenv.config();

router.use(Bodyparser());
router.use(Cookie());

// 로그인
router.post('/', async (ctx: Koa.Context) => {
  const { body } = ctx.request;
  const id = body.userId;
  const pw = body.userPw;

  console.log(id);
  console.log(pw);

  await axios.post('라붐스주소', {
    token: '',
    userId: id,
    userPw: pw, // 변환된 비밀번호
  }).then((response) => {
    const accessToken = jwt.sign(response.data, process.env.AccessSecretKey, { expiresIn: '7d' });
    // jwt 토큰 생성

    ctx.cookies.set('access_token', accessToken, { httpOnly: true, maxAge: 1000 * 60 * 60 });
    // 토큰을 쿠키로 발급
    ctx.body = response.data; // 확인용
  });
});
/*
* 유저 아이디와 비밀번호를 받음
* NERA 토큰과 같이 RABUMS 서버와 통신
* 로그인 성공시 유저 정보와 관련된 토큰 발급
*/
// 로그아웃
router.post('/logout', (ctx: Koa.Context) => {
  ctx.cookies.set('access_token', '', { httpOnly: true, maxAge: 0 });
  ctx.status = 204;
});
export = router
