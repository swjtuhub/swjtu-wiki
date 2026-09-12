const paths = [
  '/zh-CN/',
  '/zh-CN/browse/archives/',
  '/zh-CN/browse/categories/',
  '/zh-CN/browse/tags/',
  '/zh-CN/docs/recommendation/free-analysis/',
  '/free/',
  '/categories/',
  '/html/supervisor.html',
];

const results = await Promise.all(
  paths.map(async (pathname) => {
    const response = await fetch(`http://127.0.0.1:4321${pathname}`, {
      redirect: 'manual',
    });

    return {
      pathname,
      status: response.status,
      contentType: response.headers.get('content-type'),
      location: response.headers.get('location'),
    };
  }),
);

console.table(results);

if (results.some((result) => result.status >= 400)) process.exitCode = 1;
