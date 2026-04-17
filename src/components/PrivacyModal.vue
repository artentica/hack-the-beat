<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')" aria-label="Fermer">
        ✕
      </button>

      <h3>
        {{
          locale === "fr" ? "Politique de confidentialité" : "Privacy Policy"
        }}
      </h3>

      <template v-if="locale === 'fr'">
        <p>
          Le formulaire suivant nécessite le traitement de vos données
          personnelles. Conformément au Règlement Général sur la Protection des
          Données (RGPD) n°2016/679 du Parlement européen, cet avis vous fournit
          les informations nécessaires concernant le traitement de vos données
          personnelles.
        </p>
        <p>
          Dans le cadre de ce jeu, vous serez invité(e) à fournir des données
          personnelles dans le formulaire ci-dessous. Vos données seront
          traitées par Collaboration Betters The World S.A/N.V, société belge
          dont le siège social est situé au 34 rue Laffitte – 75009 PARIS
          (ci-après « CBTW ») et ses filiales, partenaires et leurs
          sous-traitants respectifs, conformément à la
          <a
            href="https://cbtw.tech/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Politique de Confidentialité de CBTW</a
          >. Vos données personnelles seront traitées sur la base juridique de
          votre consentement à ce traitement, aux fins de vous contacter à
          l'avenir par SMS, téléphone ou e-mail, et pour établir des
          statistiques agrégées sur les participants et leurs réponses. Vos
          données personnelles seront supprimées au plus tard le 13 juin 2026.
          Conformément à la Politique de Confidentialité de CBTW, vous pouvez
          exercer vos droits au titre du RGPD, y compris le retrait de votre
          consentement, en adressant une demande à
          <a href="mailto:privacypolicy@cbtw.tech">privacypolicy@cbtw.tech</a>.
        </p>
        <ul>
          <li>Droit d'accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit à l'effacement (« droit à l'oubli »)</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit à la portabilité des données</li>
          <li>Droit d'opposition</li>
        </ul>
      </template>

      <template v-else>
        <p>
          The following form requests the process of your personal data. In
          compliance with the General Data Protection Regulation (GDPR)
          n°2016/679 of the European Parliament, this notice provides you with
          adequate information regarding the processing of your personal data.
        </p>
        <p>
          For the purpose of this game, you will be required to provide personal
          data in the form below. Your data will be processed by Collaboration
          Betters The World S.A/N.V, a Belgian company having its registered
          offices at 34 rue Laffitte – 75009 PARIS (hereunder referred as
          "CBTW") and its affiliates, partners and their respective contractors
          in accordance with the provisions of CBTW
          <a
            href="https://cbtw.tech/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy</a
          >. Your personal data will be processed based on the legal basis of
          your consent to such processing for the purposes of contacting you in
          the future via SMS, phone or email, and for establishing aggregate
          statistics about the participants and their answers. Your personal
          data will be deleted no later than 13 June 2026. As valued in CBTW
          Privacy Policy you can exercise your rights under GDPR, including the
          withdraw of your consent, by addressing a request at
          <a href="mailto:privacypolicy@cbtw.tech">privacypolicy@cbtw.tech</a>.
        </p>
        <ul>
          <li>Right of access to your data</li>
          <li>Right of rectification</li>
          <li>Right to erasure ("right to be forgotten")</li>
          <li>Right to restriction of processing</li>
          <li>Right to data portability</li>
          <li>Right to object</li>
        </ul>
      </template>

      <div class="modal-actions">
        <button class="button secondary" @click="$emit('close')">
          {{ locale === "fr" ? "Fermer" : "Close" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "../i18n/index.js";

const { locale } = useI18n();
defineEmits(["close"]);
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 16px;
}

.modal-content {
  background: var(--app-background-color, #141418);
  border: 1px solid var(--surface-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  padding: 32px 28px 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  color: var(--main-font-color);

  h3 {
    font-size: 1.3em;
    font-weight: 700;
    margin-bottom: 18px;
  }

  p {
    line-height: 1.65;
    font-size: 0.92em;
    margin-bottom: 14px;
    color: var(--secondary-font-color, #9e9e9e);
  }

  ul {
    padding-left: 20px;
    margin-bottom: 16px;

    li {
      line-height: 1.6;
      font-size: 0.92em;
      color: var(--secondary-font-color, #9e9e9e);
      margin-bottom: 4px;
    }
  }

  a {
    color: var(--accent-color, #f5ed63);
    text-decoration: underline;
  }
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  color: var(--secondary-font-color, #9e9e9e);
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
  transition: color 0.2s;

  &:hover {
    color: var(--main-font-color);
  }
}

.modal-actions {
  text-align: right;
  margin-top: 20px;
}
</style>
