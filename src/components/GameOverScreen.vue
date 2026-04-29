<template>
  <div class="game-over-screen">
    <h2>{{ t("gameOver") }}</h2>
    <p class="final-score">
      {{ t("finalScore") }} <strong>{{ score }}</strong>
    </p>
    <div class="final-stats">
      <span>{{ t("levelReached") }} {{ level }}</span>
      <span>{{ t("bestCombo") }} {{ maxCombo }}</span>
      <span>{{ t("perfectCount", { count: perfectCount }) }}</span>
    </div>

    <template v-if="!saved">
      <hr />
      <h3>Enregistrer votre score</h3>
      <p class="form-intro">
        Veuillez noter que ce formulaire vous demandera de saisir des données
        personnelles telles que, sans s'y limiter, vos coordonnées
        professionnelles et l'entité de l'entreprise pour laquelle vous
        travaillez.
      </p>

      <div class="form-group">
        <label for="goFirstName">Prénom <span class="req">*</span></label>
        <input
          id="goFirstName"
          v-model="form.firstName"
          type="text"
          placeholder="Prénom"
          @blur="validate('firstName')"
          :class="{ 'input-error': errors.firstName }"
        />
        <span v-if="errors.firstName" class="field-error">Prénom requis.</span>
      </div>

      <div class="form-group">
        <label for="goLastName">Nom <span class="req">*</span></label>
        <input
          id="goLastName"
          v-model="form.lastName"
          type="text"
          placeholder="Nom"
          @blur="validate('lastName')"
          :class="{ 'input-error': errors.lastName }"
        />
        <span v-if="errors.lastName" class="field-error">Nom requis.</span>
      </div>

      <div class="form-group">
        <label for="goEmail">Email <span class="req">*</span></label>
        <input
          id="goEmail"
          v-model="form.email"
          type="email"
          placeholder="Email"
          @blur="validate('email')"
          :class="{ 'input-error': errors.email }"
        />
        <span v-if="errors.email" class="field-error">{{ emailError }}</span>
      </div>

      <div class="form-group">
        <label for="goPhone">Téléphone <span class="req">*</span></label>
        <input
          id="goPhone"
          v-model="form.phone"
          type="tel"
          placeholder="Ex: 0612345678 ou +33612345678"
          @blur="validate('phone')"
          :class="{ 'input-error': errors.phone }"
        />
        <span v-if="errors.phone" class="field-error">{{ phoneError }}</span>
      </div>

      <div class="form-group">
        <label for="goPosition"
          >Poste occupé <span class="optional">(facultatif)</span></label
        >
        <input
          id="goPosition"
          v-model="form.position"
          type="text"
          placeholder="Ex: Développeur, Manager..."
        />
      </div>

      <div class="form-group checkbox-group">
        <input type="checkbox" id="goConsent" v-model="form.consent" />
        <label for="goConsent" class="checkbox-label">
          Je consens au traitement de mes données personnelles conformément à la
          Politique de Confidentialité de CBTW aux fins décrites ci-dessus.
          <span class="req">*</span>
        </label>
      </div>

      <p class="form-note"><span class="req">*</span> Champs obligatoires</p>
      <p v-if="formError" class="form-error">{{ formError }}</p>

      <a class="privacy-link" @click="$emit('showPrivacy')"
        >Politique de confidentialité</a
      >

      <button class="button accent" :disabled="!canSubmit" @click="submit">
        <Save :size="16" :stroke-width="2" /> Enregistrer
      </button>
    </template>

    <template v-else>
      <p class="saved-msg">
        Score enregistré avec succès !
        <span v-if="rank"
          >Vous êtes classé(e) <strong>#{{ rank }}</strong> !</span
        >
      </p>
    </template>

    <hr />
    <div class="actions">
      <button @click="$emit('viewScores')" class="button cbtw-style">
        <Award :size="16" :stroke-width="2" /> {{ t("viewScores") }}
      </button>
      <button @click="$emit('replay')" class="button secondary">
        <RotateCcw :size="16" :stroke-width="2" /> {{ t("replay") }}
      </button>
      <button @click="$emit('home')" class="button">
        <Home :size="16" :stroke-width="2" /> {{ t("home") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { Award, Home, RotateCcw, Save } from "lucide-vue-next";
import { computed, reactive, ref } from "vue";
import { useI18n } from "../i18n/index.js";

const { t } = useI18n();

const props = defineProps({
  score: Number,
  level: Number,
  maxCombo: Number,
  perfectCount: Number,
});

const emit = defineEmits([
  "save",
  "viewScores",
  "replay",
  "home",
  "showPrivacy",
]);

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
  consent: false,
});

const errors = reactive({
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
});

const emailError = ref("L'email est requis.");
const phoneError = ref("Le numéro de téléphone est requis.");
const formError = ref("");
const saved = ref(false);
const rank = ref(null);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

function validate(field) {
  if (field === "firstName") {
    errors.firstName = form.firstName.trim() === "";
  } else if (field === "lastName") {
    errors.lastName = form.lastName.trim() === "";
  } else if (field === "email") {
    if (form.email.trim() === "") {
      errors.email = true;
      emailError.value = "L'email est requis.";
    } else if (!EMAIL_RE.test(form.email)) {
      errors.email = true;
      emailError.value = "Format d'email invalide.";
    } else {
      errors.email = false;
    }
  } else if (field === "phone") {
    const cleaned = form.phone.replace(/[\s()-]/g, "");
    if (cleaned === "") {
      errors.phone = true;
      phoneError.value = "Le numéro de téléphone est requis.";
    } else if (!PHONE_RE.test(cleaned)) {
      errors.phone = true;
      phoneError.value = "Format invalide (ex: 0612345678 ou +33612345678).";
    } else {
      errors.phone = false;
    }
  }
}

const canSubmit = computed(() => {
  return (
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.email.trim() !== "" &&
    form.phone.trim() !== "" &&
    form.consent &&
    !errors.firstName &&
    !errors.lastName &&
    !errors.email &&
    !errors.phone
  );
});

function submit() {
  ["firstName", "lastName", "email", "phone"].forEach(validate);
  if (!form.consent) {
    formError.value = "Vous devez accepter la politique de confidentialité.";
    return;
  }
  if (!canSubmit.value) {
    formError.value = "Veuillez corriger les erreurs ci-dessus.";
    return;
  }
  formError.value = "";
  emit("save", {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    position: form.position.trim(),
  });
}

function setSaved(r) {
  saved.value = true;
  rank.value = r;
}

defineExpose({ setSaved });
</script>

<style lang="scss" scoped>
.game-over-screen {
  text-align: center;
  width: 100%;
  padding: 24px 20px;
}

.final-score {
  font-size: 1.4em;
  margin: 8px 0;
}

.final-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 0.92em;
  color: var(--secondary-font-color, #555);
  margin-bottom: 8px;
}

hr {
  margin: 20px auto;
  border: 0;
  height: 1px;
  background: var(--surface-border, #ddd);
  width: 80%;
}

h3 {
  margin-bottom: 8px;
}

.form-intro {
  font-size: 0.88em;
  color: var(--secondary-font-color, #555);
  margin-bottom: 16px;
  max-width: 450px;
  text-align: left;
  margin-left: auto;
  margin-right: auto;
}

.form-group {
  margin-bottom: 14px;
  text-align: left;
  width: 90%;
  max-width: 450px;
  margin-left: auto;
  margin-right: auto;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 0.9em;
}

.req {
  color: var(--danger-color, #c62828);
  font-weight: bold;
}

.optional {
  font-size: 0.85em;
  color: var(--secondary-font-color, #757575);
  font-weight: normal;
  margin-left: 4px;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--surface-border, #bdbdbd);
  border-radius: 10px;
  font-size: 1em;
  box-sizing: border-box;
  background: var(--surface-color);
  color: var(--main-font-color);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-glow, rgba(245, 237, 99, 0.3));
}

.input-error {
  border-color: var(--danger-color, #c62828) !important;
  box-shadow: 0 0 0 2px rgba(200, 0, 0, 0.15) !important;
}

.field-error {
  display: block;
  color: var(--danger-color, #c62828);
  font-size: 0.8em;
  margin-top: 4px;
}

.checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  margin-top: 3px;
}

.checkbox-label {
  font-size: 0.85em;
  font-weight: normal;
  line-height: 1.4;
  cursor: pointer;
}

.form-note {
  font-size: 0.8em;
  color: var(--secondary-font-color, #757575);
  margin: 8px 0;
}

.form-error {
  color: var(--danger-color, #c62828);
  font-size: 0.9em;
  margin: 8px 0;
}

.privacy-link {
  font-size: 0.85em;
  text-decoration: underline;
  cursor: pointer;
  display: block;
  margin: 8px auto 16px;
  max-width: 450px;
  text-align: left;
  color: var(--main-font-color);
}

.privacy-link:hover {
  color: var(--accent-color);
}

.saved-msg {
  font-size: 1.1em;
  color: var(--success-color, #388e3c);
  margin: 16px 0;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
}
</style>
