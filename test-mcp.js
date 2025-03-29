#!/usr/bin/env node
const { spawn } = require('child_process');
const readline = require('readline');

/**
 * MCP クライアントのテスト用スクリプト
 */

// MCPサーバーを起動
const server = spawn('ts-node', ['src/index.ts'], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// 標準入出力を処理
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 簡単なプロトコル実装
async function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };
  
  const requestStr = JSON.stringify(request);
  const contentLength = Buffer.byteLength(requestStr, 'utf8');
  
  // ヘッダーとコンテンツを送信
  server.stdin.write(`Content-Length: ${contentLength}\r\n\r\n${requestStr}`);
  
  // レスポンスを待機
  return new Promise((resolve) => {
    const onDataHandler = (data) => {
      const responseStr = data.toString();
      if (responseStr.includes('Content-Length:')) {
        const parts = responseStr.split('\r\n\r\n');
        if (parts.length > 1) {
          const jsonResponse = JSON.parse(parts[1]);
          server.stdout.removeListener('data', onDataHandler);
          resolve(jsonResponse);
        }
      }
    };
    
    server.stdout.on('data', onDataHandler);
  });
}

async function runTest() {
  try {
    console.log('🔍 利用可能なツールを取得中...');
    const toolsResponse = await sendRequest('listTools', {});
    console.log('📋 利用可能なツール:');
    toolsResponse.result.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    
    rl.question('\n🛠 テストするツール名を入力してください (例: get_pull_request): ', async (toolName) => {
      if (!toolName) {
        console.log('❌ ツール名が指定されていません。終了します。');
        cleanup();
        return;
      }
      
      const tool = toolsResponse.result.tools.find(t => t.name === toolName);
      if (!tool) {
        console.log(`❌ ツール "${toolName}" が見つかりませんでした。終了します。`);
        cleanup();
        return;
      }
      
      console.log(`\n📝 "${toolName}" のパラメータ例を生成しています...`);
      // パラメータの例を生成
      const params = {};
      if (tool.inputSchema && tool.inputSchema.properties) {
        for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
          if (toolName === 'get_pull_request' && key === 'pull_number') {
            params[key] = 1;
          } else if (toolName === 'get_diff' && key === 'prId') {
            params[key] = 1;
          } else {
            params[key] = prop.type === 'number' ? 1 : (prop.type === 'boolean' ? true : 'example');
          }
        }
      }
      
      console.log(JSON.stringify(params, null, 2));
      
      rl.question('\n🔧 使用するパラメータをJSONで入力してください (上記例を編集可): ', async (paramsInput) => {
        try {
          const inputParams = JSON.parse(paramsInput);
          console.log('\n🚀 ツールを実行しています...');
          
          const response = await sendRequest('callTool', {
            name: toolName,
            arguments: inputParams
          });
          
          console.log('\n📊 結果:');
          if (response.error) {
            console.log('❌ エラー:', response.error);
          } else {
            if (response.result.content) {
              response.result.content.forEach(item => {
                if (item.type === 'text') {
                  try {
                    // JSONの場合は整形して表示
                    const json = JSON.parse(item.text);
                    console.log(JSON.stringify(json, null, 2));
                  } catch {
                    // プレーンテキストとして表示
                    console.log(item.text);
                  }
                }
              });
            } else {
              console.log(response.result);
            }
          }
          
          cleanup();
        } catch (err) {
          console.log('❌ 無効なJSONフォーマットです:', err.message);
          cleanup();
        }
      });
    });
  } catch (err) {
    console.error('❌ テスト実行中にエラーが発生しました:', err);
    cleanup();
  }
}

function cleanup() {
  rl.close();
  server.stdin.end();
  server.kill();
}

// テスト開始
console.log('🔌 MCPサーバーに接続しています...');
setTimeout(runTest, 1000); // サーバー起動待ち 