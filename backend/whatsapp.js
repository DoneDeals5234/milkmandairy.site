import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

// Initialize the WhatsApp Client
// We use LocalAuth so it remembers your session across restarts
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

let isClientReady = false;

// Generate and display the QR code in the terminal
client.on('qr', (qr) => {
    console.log('\n=========================================');
    console.log('📲 SCAN THIS QR CODE WITH YOUR WHATSAPP');
    console.log('=========================================\n');
    qrcode.generate(qr, { small: true });
});

// When successfully authenticated
client.on('ready', () => {
    console.log('✅ WhatsApp Web Client is Ready!');
    isClientReady = true;
});

// Handle authentication failures
client.on('auth_failure', msg => {
    console.error('❌ WhatsApp Authentication Failed:', msg);
});

// Initialize the client (will be called from server.js)
export const initWhatsApp = () => {
    console.log('Starting WhatsApp Engine...');
    try {
        client.initialize().catch(err => {
            console.warn('⚠️ WhatsApp notice (non-fatal, continuing web server):', err.message);
        });
    } catch (e) {
        console.warn('⚠️ WhatsApp start error (non-fatal, continuing web server):', e.message);
    }
};

// Function to send OTP via WhatsApp
export const sendWhatsAppOTP = async (phoneNumber, otpCode) => {
    if (!isClientReady) {
        console.error('WhatsApp is not ready yet! Cannot send OTP.');
        throw new Error('WhatsApp not ready');
    }

    try {
        // Format number: remove + and spaces
        let cleanNumber = phoneNumber.replace(/\D/g, '');

        // Auto-add Indian country code if user only entered 10 digits
        if (cleanNumber.length === 10) {
            cleanNumber = '91' + cleanNumber;
        }

        const chatId = `${cleanNumber}@c.us`;

        const message = `🥛 *Milkman Dairy*\n\nYour Login OTP is: *${otpCode}*\nDo not share this code with anyone.`;

        await client.sendMessage(chatId, message);
        console.log(`✅ WhatsApp OTP sent to ${phoneNumber}`);
    } catch (error) {
        console.error('❌ Failed to send WhatsApp OTP:', error);
        throw error;
    }
};

export const OWNER_PHONE = "7696880795";
export const OWNER_CHAT_ID = "917696880795@c.us";

export const formatToChatId = (phoneNumber) => {
    if (!phoneNumber) return null;
    let cleanNumber = String(phoneNumber).replace(/\D/g, '');
    if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
    }
    return `${cleanNumber}@c.us`;
};

export const sendWhatsAppMessage = async (chatId, message) => {
    if (!isClientReady) {
        console.warn('⚠️ WhatsApp client not ready yet. Skipping message send.');
        return false;
    }
    try {
        await client.sendMessage(chatId, message);
        console.log(`✅ WhatsApp message sent to ${chatId}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send WhatsApp message to', chatId, error.message);
        return false;
    }
};

export const sendWhatsAppNotification = async (phoneNumber, message) => {
    const chatId = formatToChatId(phoneNumber);
    if (!chatId) return false;
    return await sendWhatsAppMessage(chatId, message);
};

export const sendOwnerAlert = async (message) => {
    console.log(`📢 Dispatching Owner WhatsApp Alert to ${OWNER_PHONE}...`);
    return await sendWhatsAppMessage(OWNER_CHAT_ID, message);
};
>>>>>>> Stashed changes
            } else {
    throw err;
}
        }
<<<<<<< Updated upstream

console.log(`✅ WhatsApp OTP sent to ${phoneNumber} (${targetId})`);
=======

        console.log(`✅ WhatsApp message sent to ${chatId}`);
        return true;
>>>>>>> Stashed changes
    } catch (error) {
    console.error('❌ Failed to send WhatsApp message to', chatId, error.message);
    return false;
}
}

// Function to send OTP via WhatsApp
export const sendWhatsAppOTP = async (phoneNumber, otpCode) => {
    const chatId = formatToChatId(phoneNumber);
    if (!chatId) throw new Error('Invalid phone number');

    const message = `🥛 *Milkman Dairy*\n\nYour Login OTP is: *${otpCode}*\nDo not share this code with anyone.`;
    const success = await sendRobustMessage(chatId, message);
    if (!success) {
        throw new Error('Failed to deliver OTP via WhatsApp');
    }
    return true;
};

export const sendWhatsAppMessage = async (chatId, message) => {
    return await sendRobustMessage(chatId, message);
};

export const sendWhatsAppNotification = async (phoneNumber, message) => {
    const chatId = formatToChatId(phoneNumber);
    if (!chatId) return false;
    return await sendRobustMessage(chatId, message);
};

export const sendOwnerAlert = async (message) => {
    console.log(`📢 Dispatching Owner WhatsApp Alert to ${OWNER_PHONE}...`);
    return await sendRobustMessage(OWNER_CHAT_ID, message);
};
