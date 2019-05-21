
try {
    throw new Error('에러 잡히나?')
} catch(e) {
    console.log('에러 잡히나 보자');
    console.log(e);
}