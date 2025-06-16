// 📁 server/src/services/emailService.js
const { Resend } = require('resend');

class EmailService {
  constructor() {
    console.log('🔧 INICIALIZANDO EMAIL SERVICE:');
    console.log('  RESEND_API_KEY existe:', !!process.env.RESEND_API_KEY);
    console.log('  RESEND_API_KEY longitud:', process.env.RESEND_API_KEY?.length);
    console.log('  RESEND_API_KEY empieza con re_:', process.env.RESEND_API_KEY?.startsWith('re_'));
    console.log('  FROM_EMAIL:', process.env.FROM_EMAIL);
    console.log('  CLIENT_URL:', process.env.CLIENT_URL);
    
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@flagfootball.com';
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  }

  // 🔥 PLANTILLA BASE PARA EMAILS
  crearPlantillaBase(titulo, contenido, linkUrl = null, linkTexto = null) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titulo}</title>
      <style>
        .container {
          max-width: 600px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #0f4c81, #3f2b96);
          color: white;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
        }
        .content {
          background: rgba(255, 255, 255, 0.1);
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background: #ffd700;
          color: #000;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          opacity: 0.8;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏈 AGS Flag Football League</div>
        </div>
        <div class="content">
          <h2>${titulo}</h2>
          ${contenido}
          ${linkUrl ? `<p><a href="${linkUrl}" class="button">${linkTexto}</a></p>` : ''}
        </div>
        <div class="footer">
          <p>Este es un email automático, no responder.</p>
          <p>AGS Flag Football League © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // En emailService.js, en la función enviarEmailVerificacion
  async enviarEmailVerificacion(email, token, nombre = '') {
    try {
      console.log('🔧 DEBUG EMAIL SERVICE:');
      console.log('  API Key configurada:', !!this.resend);
      console.log('  From email:', this.fromEmail);
      console.log('  Client URL:', this.clientUrl);
      
      const urlVerificacion = `${this.clientUrl}/auth/verify-email/${token}`;
      console.log('  URL de verificación:', urlVerificacion);
      
      const contenido = `
        <p>¡Hola ${nombre || 'futuro jugador'}! 👋</p>
        <p>Gracias por registrarte en AGS Flag Football League.</p>
        <p>Para completar tu registro y activar tu cuenta, necesitas verificar tu dirección de email.</p>
        <p><strong>Este link expira en 24 horas.</strong></p>
        <br>
        <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
      `;

      const html = this.crearPlantillaBase(
        'Verifica tu cuenta',
        contenido,
        urlVerificacion,
        'Verificar mi email'
      );

      console.log('📧 Intentando enviar email...');
      
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '🏈 Verifica tu cuenta - AGS Flag Football',
        html
      });

      console.log('📨 Resultado completo de Resend:', result);
      console.log('📨 Result.id:', result?.id);
      console.log('✅ Email de verificación enviado:', result?.id);
      
      return { success: true, id: result?.id };

    } catch (error) {
      console.error('❌ Error enviando email de verificación:', error);
      console.error('❌ Error detallado:', error.message);
      console.error('❌ Error stack:', error.stack);
      return { success: false, error: error.message };
    }
  }

  // 🔐 ENVIAR EMAIL DE RECUPERACIÓN
  async enviarEmailRecuperacion(email, token, nombre = '') {
    try {
      const urlRecuperacion = `${this.clientUrl}/auth/reset-password/${token}`;
      
      const contenido = `
        <p>¡Hola ${nombre || 'jugador'}! 👋</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
        <p><strong>Este link expira en 10 minutos por seguridad.</strong></p>
        <br>
        <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no cambiará.</p>
      `;

      const html = this.crearPlantillaBase(
        'Restablece tu contraseña',
        contenido,
        urlRecuperacion,
        'Crear nueva contraseña'
      );

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '🔐 Restablece tu contraseña - AGS Flag Football',
        html
      });

      console.log('✅ Email de recuperación enviado:', result.id);
      return { success: true, id: result.id };

    } catch (error) {
      console.error('❌ Error enviando email de recuperación:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ ENVIAR EMAIL DE BIENVENIDA
  async enviarEmailBienvenida(email, nombre = '') {
    try {
      const contenido = `
        <p>¡Bienvenido a AGS Flag Football League, ${nombre || 'jugador'}! 🎉</p>
        <p>Tu cuenta ha sido verificada exitosamente.</p>
        <p>Ya puedes acceder a todas las funcionalidades de la plataforma:</p>
        <ul>
          <li>✅ Unirte a equipos</li>
          <li>✅ Participar en torneos</li>
          <li>✅ Ver estadísticas</li>
          <li>✅ Mucho más...</li>
        </ul>
        <p>¡Es hora de jugar! 🏈</p>
      `;

      const html = this.crearPlantillaBase(
        '¡Cuenta verificada!',
        contenido,
        `${this.clientUrl}/auth/login`,
        'Iniciar sesión'
      );

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '🎉 ¡Bienvenido a AGS Flag Football! - Cuenta activada',
        html
      });

      console.log('✅ Email de bienvenida enviado:', result.id);
      return { success: true, id: result.id };

    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔄 REENVIAR VERIFICACIÓN
  async reenviarVerificacion(email, token, nombre = '') {
    try {
      const urlVerificacion = `${this.clientUrl}/auth/verify-email/${token}`;
      
      const contenido = `
        <p>¡Hola ${nombre || 'jugador'}! 👋</p>
        <p>Aquí tienes un nuevo link de verificación como solicitaste.</p>
        <p>Haz clic en el botón para verificar tu cuenta:</p>
        <p><strong>Este nuevo link expira en 24 horas.</strong></p>
      `;

      const html = this.crearPlantillaBase(
        'Nuevo link de verificación',
        contenido,
        urlVerificacion,
        'Verificar mi email'
      );

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '🔄 Nuevo link de verificación - AGS Flag Football',
        html
      });

      console.log('✅ Email de re-verificación enviado:', result.id);
      return { success: true, id: result.id };

    } catch (error) {
      console.error('❌ Error reenviando verificación:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();