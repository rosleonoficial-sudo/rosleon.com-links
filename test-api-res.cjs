const http = require('http');

http.get('http://localhost:3000/api/results', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const json = JSON.parse(data);
    console.log('Keys in response:', Object.keys(json));
    console.log('Pagination:', json.pagination);
    console.log('First item sample:', json.data ? json.data[0] : json.contents ? json.contents[0] : 'None');
  });
});
