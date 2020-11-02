
export function constructPostForm(json) {
    var formBody = [];
    for (var property in json) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(json[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    return{
      method: 'post',
      headers: {
          'Accept': '*/*',
          'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
    };
  }