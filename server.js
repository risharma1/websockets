const http = require('http');
const crypto = require('crypto');
const static = require('node-static');
const file = new static.Server('./');
const server = http.createServer((req, res) => {
  req.addListener('end', () => file.serve(req, res)).resume();
});
server.on('upgrade', function (req, socket) {
  if (req.headers['upgrade'] !== 'websocket') {
    socket.end('HTTP/1.1 400 Bad Request');
    return;
  }
  // Read the websocket key provided by the client: const acceptKey = req.headers['sec-websocket-key']; // Generate the response value to use in the response: const hash = generateAcceptValue(acceptKey); // Write the HTTP response into an array of response lines: const responseHeaders = [ 'HTTP/1.1 101 Web Socket Protocol Handshake', 'Upgrade: WebSocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${hash}` ]; // Write the response back to the client socket, being sure to append two // additional newlines so that the browser recognises the end of the response // header and doesn't continue to wait for more header data: socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
});
 // Don't forget the hashing function described earlier:
function generateAcceptValue (acceptKey) {
  return crypto
  .createHash('sha1')
  .update(acceptKey + '258EAFA5-E914–47DA-95CA-C5AB0DC85B11', 'binary')
  .digest('base64');
}

// Read the subprotocol from the client request headers:
const protocol = req.headers['sec-websocket-protocol'];
// If provided, they'll be formatted as a comma-delimited string of protocol
// names that the client supports; we'll need to parse the header value, if
// provided, and see what options the client is offering:
const protocols = !protocol ? [] : protocol.split(',').map(s => s.trim());
// To keep it simple, we'll just see if JSON was an option, and if so, include
// it in the HTTP response:
if (protocols.includes('json')) {
  // Tell the client that we agree to communicate with JSON data
  responseHeaders.push(`Sec-WebSocket-Protocol: json`);
}

socket.on('data', buffer => {
  const message = parseMessage(buffer);
  if (message) {
  // For our convenience, so we can see what the client sent
  console.log(message);
  // We'll just send a hardcoded message in this example 
  socket.write(constructReply({ message: 'Hello from the server!' })); 
  } else if (message === null) { 
      console.log('WebSocket connection closed by the client.'); 
  }
});
function constructReply(data) {
  // TODO: Construct a WebSocket frame Node.js socket buffer
}
function parseMessage(buffer) {
  // TODO: Parse the WebSocket frame from the Node.js socket buffer
}


function parseMessage (buffer) {
  const firstByte = buffer.readUInt8(0);
  const isFinalFrame = Boolean((firstByte >>> 7) & 0×1); 
  const [reserved1, reserved2, reserved3] = [ Boolean((firstByte >>> 6) & 0×1), Boolean((firstByte >>> 5) & 0×1), Boolean((firstByte >>> 4) & 0×1) ]; 
  const opCode = firstByte & 0xF; 
  // We can return null to signify that this is a connection termination frame 
  if (opCode === 0×8) 
     return null; 
  // We only care about text frames from this point onward 
  if (opCode !== 0×1) 
    return; 
  const secondByte = buffer.readUInt8(1); 
  const isMasked = Boolean((secondByte >>> 7) & 0×1); 
  // Keep track of our current position as we advance through the buffer 
  let currentOffset = 2; let payloadLength = secondByte & 0×7F; 
  if (payloadLength > 125) { 
    if (payloadLength === 126) { 
      payloadLength = buffer.readUInt16BE(currentOffset); 
      currentOffset += 2; 
    } else { 
      // 127 
      // If this has a value, the frame size is ridiculously huge! 
      const leftPart = buffer.readUInt32BE(currentOffset); 
      const rightPart = buffer.readUInt32BE(currentOffset += 4); 
      // Honestly, if the frame length requires 64 bits, you're probably doing it wrong. 
      // In Node.js you'll require the BigInt type, or a special library to handle this. throw new Error('Large payloads not currently implemented'); 
    } 
  }

  let maskingKey;
  if (isMasked) {
    maskingKey = buffer.readUInt32BE(currentOffset);
    currentOffset += 4;
  }

  // Allocate somewhere to store the final message data
  const data = Buffer.alloc(payloadLength);
  // Only unmask the data if the masking bit was set to 1
  if (isMasked) {
    // Loop through the source buffer one byte at a time, keeping track of which
    // byte in the masking key to use in the next XOR calculation
    for (let i = 0, j = 0; i < payloadLength; ++i, j = i % 4) {
    // Extract the correct byte mask from the masking key
      const shift = j = 3 ? 0 : (3 - j) << 3; 
      const mask = (shift = 0 ? maskingKey : (maskingKey >>> shift)) & 0xFF;
      // Read a byte from the source buffer const source = buffer.readUInt8(currentOffset++); // XOR the source byte and write the result to the data buffer data.writeUInt8(mask ^ source, i); }
    }
  } else {
    // Not masked - we can just read the data as-is
    buffer.copy(data, 0, currentOffset++);
  }
  const json = data.toString('utf8'); return JSON.parse(json);
}