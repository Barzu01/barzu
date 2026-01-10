import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { carAPI, brandsAPI } from '../../services/api';
import { REGIONS } from '../../constants/carData';
import { BODY_TYPES, CAR_FEATURES, ENGINE_VOLUMES, COLORS } from '../../constants/theme';
import SearchableSelect from '../../components/SearchableSelect';

interface Brand {
  name: string;
  make_id: number;
}

interface CarModel {
  name: string;
  model_id: number;
}

// Все модели Mercedes-Benz
const MERCEDES_MODELS: CarModel[] = [
  // A-Class
  { name: 'A-Class', model_id: 1 },
  { name: 'A 160', model_id: 2 },
  { name: 'A 180', model_id: 3 },
  { name: 'A 200', model_id: 4 },
  { name: 'A 220', model_id: 5 },
  { name: 'A 250', model_id: 6 },
  { name: 'A 35 AMG', model_id: 7 },
  { name: 'A 45 AMG', model_id: 8 },
  // B-Class
  { name: 'B-Class', model_id: 10 },
  { name: 'B 150', model_id: 11 },
  { name: 'B 170', model_id: 12 },
  { name: 'B 180', model_id: 13 },
  { name: 'B 200', model_id: 14 },
  { name: 'B 220', model_id: 15 },
  { name: 'B 250', model_id: 16 },
  // C-Class
  { name: 'C-Class', model_id: 20 },
  { name: 'C 160', model_id: 21 },
  { name: 'C 180', model_id: 22 },
  { name: 'C 200', model_id: 23 },
  { name: 'C 220', model_id: 24 },
  { name: 'C 230', model_id: 25 },
  { name: 'C 240', model_id: 26 },
  { name: 'C 250', model_id: 27 },
  { name: 'C 280', model_id: 28 },
  { name: 'C 300', model_id: 29 },
  { name: 'C 320', model_id: 30 },
  { name: 'C 350', model_id: 31 },
  { name: 'C 400', model_id: 32 },
  { name: 'C 43 AMG', model_id: 33 },
  { name: 'C 55 AMG', model_id: 34 },
  { name: 'C 63 AMG', model_id: 35 },
  // CLA-Class
  { name: 'CLA', model_id: 40 },
  { name: 'CLA 180', model_id: 41 },
  { name: 'CLA 200', model_id: 42 },
  { name: 'CLA 220', model_id: 43 },
  { name: 'CLA 250', model_id: 44 },
  { name: 'CLA 35 AMG', model_id: 45 },
  { name: 'CLA 45 AMG', model_id: 46 },
  // CLS-Class
  { name: 'CLS', model_id: 50 },
  { name: 'CLS 220', model_id: 51 },
  { name: 'CLS 250', model_id: 52 },
  { name: 'CLS 300', model_id: 53 },
  { name: 'CLS 350', model_id: 54 },
  { name: 'CLS 400', model_id: 55 },
  { name: 'CLS 450', model_id: 56 },
  { name: 'CLS 500', model_id: 57 },
  { name: 'CLS 53 AMG', model_id: 58 },
  { name: 'CLS 55 AMG', model_id: 59 },
  { name: 'CLS 63 AMG', model_id: 60 },
  // E-Class
  { name: 'E-Class', model_id: 70 },
  { name: 'E 200', model_id: 71 },
  { name: 'E 220', model_id: 72 },
  { name: 'E 230', model_id: 73 },
  { name: 'E 240', model_id: 74 },
  { name: 'E 250', model_id: 75 },
  { name: 'E 260', model_id: 76 },
  { name: 'E 280', model_id: 77 },
  { name: 'E 300', model_id: 78 },
  { name: 'E 320', model_id: 79 },
  { name: 'E 350', model_id: 80 },
  { name: 'E 400', model_id: 81 },
  { name: 'E 420', model_id: 82 },
  { name: 'E 430', model_id: 83 },
  { name: 'E 450', model_id: 84 },
  { name: 'E 500', model_id: 85 },
  { name: 'E 550', model_id: 86 },
  { name: 'E 43 AMG', model_id: 87 },
  { name: 'E 53 AMG', model_id: 88 },
  { name: 'E 55 AMG', model_id: 89 },
  { name: 'E 63 AMG', model_id: 90 },
  // S-Class
  { name: 'S-Class', model_id: 100 },
  { name: 'S 280', model_id: 101 },
  { name: 'S 300', model_id: 102 },
  { name: 'S 320', model_id: 103 },
  { name: 'S 350', model_id: 104 },
  { name: 'S 400', model_id: 105 },
  { name: 'S 420', model_id: 106 },
  { name: 'S 430', model_id: 107 },
  { name: 'S 450', model_id: 108 },
  { name: 'S 500', model_id: 109 },
  { name: 'S 550', model_id: 110 },
  { name: 'S 560', model_id: 111 },
  { name: 'S 580', model_id: 112 },
  { name: 'S 600', model_id: 113 },
  { name: 'S 63 AMG', model_id: 114 },
  { name: 'S 65 AMG', model_id: 115 },
  // G-Class
  { name: 'G-Class', model_id: 120 },
  { name: 'G 230', model_id: 121 },
  { name: 'G 270', model_id: 122 },
  { name: 'G 280', model_id: 123 },
  { name: 'G 290', model_id: 124 },
  { name: 'G 300', model_id: 125 },
  { name: 'G 320', model_id: 126 },
  { name: 'G 350', model_id: 127 },
  { name: 'G 400', model_id: 128 },
  { name: 'G 500', model_id: 129 },
  { name: 'G 550', model_id: 130 },
  { name: 'G 55 AMG', model_id: 131 },
  { name: 'G 63 AMG', model_id: 132 },
  { name: 'G 65 AMG', model_id: 133 },
  // GLA-Class
  { name: 'GLA', model_id: 140 },
  { name: 'GLA 180', model_id: 141 },
  { name: 'GLA 200', model_id: 142 },
  { name: 'GLA 220', model_id: 143 },
  { name: 'GLA 250', model_id: 144 },
  { name: 'GLA 35 AMG', model_id: 145 },
  { name: 'GLA 45 AMG', model_id: 146 },
  // GLB-Class
  { name: 'GLB', model_id: 150 },
  { name: 'GLB 180', model_id: 151 },
  { name: 'GLB 200', model_id: 152 },
  { name: 'GLB 220', model_id: 153 },
  { name: 'GLB 250', model_id: 154 },
  { name: 'GLB 35 AMG', model_id: 155 },
  // GLC-Class
  { name: 'GLC', model_id: 160 },
  { name: 'GLC 200', model_id: 161 },
  { name: 'GLC 220', model_id: 162 },
  { name: 'GLC 250', model_id: 163 },
  { name: 'GLC 300', model_id: 164 },
  { name: 'GLC 350', model_id: 165 },
  { name: 'GLC 400', model_id: 166 },
  { name: 'GLC 43 AMG', model_id: 167 },
  { name: 'GLC 63 AMG', model_id: 168 },
  { name: 'GLC Coupe', model_id: 169 },
  // GLE-Class
  { name: 'GLE', model_id: 170 },
  { name: 'GLE 250', model_id: 171 },
  { name: 'GLE 300', model_id: 172 },
  { name: 'GLE 350', model_id: 173 },
  { name: 'GLE 400', model_id: 174 },
  { name: 'GLE 450', model_id: 175 },
  { name: 'GLE 500', model_id: 176 },
  { name: 'GLE 53 AMG', model_id: 177 },
  { name: 'GLE 63 AMG', model_id: 178 },
  { name: 'GLE Coupe', model_id: 179 },
  // GLS-Class
  { name: 'GLS', model_id: 180 },
  { name: 'GLS 350', model_id: 181 },
  { name: 'GLS 400', model_id: 182 },
  { name: 'GLS 450', model_id: 183 },
  { name: 'GLS 500', model_id: 184 },
  { name: 'GLS 550', model_id: 185 },
  { name: 'GLS 580', model_id: 186 },
  { name: 'GLS 600 Maybach', model_id: 187 },
  { name: 'GLS 63 AMG', model_id: 188 },
  // ML-Class (старые)
  { name: 'ML-Class', model_id: 190 },
  { name: 'ML 230', model_id: 191 },
  { name: 'ML 250', model_id: 192 },
  { name: 'ML 270', model_id: 193 },
  { name: 'ML 280', model_id: 194 },
  { name: 'ML 300', model_id: 195 },
  { name: 'ML 320', model_id: 196 },
  { name: 'ML 350', model_id: 197 },
  { name: 'ML 400', model_id: 198 },
  { name: 'ML 430', model_id: 199 },
  { name: 'ML 450', model_id: 200 },
  { name: 'ML 500', model_id: 201 },
  { name: 'ML 550', model_id: 202 },
  { name: 'ML 55 AMG', model_id: 203 },
  { name: 'ML 63 AMG', model_id: 204 },
  // GL-Class (старые)
  { name: 'GL-Class', model_id: 210 },
  { name: 'GL 320', model_id: 211 },
  { name: 'GL 350', model_id: 212 },
  { name: 'GL 420', model_id: 213 },
  { name: 'GL 450', model_id: 214 },
  { name: 'GL 500', model_id: 215 },
  { name: 'GL 550', model_id: 216 },
  { name: 'GL 63 AMG', model_id: 217 },
  // GLK-Class
  { name: 'GLK', model_id: 220 },
  { name: 'GLK 200', model_id: 221 },
  { name: 'GLK 220', model_id: 222 },
  { name: 'GLK 250', model_id: 223 },
  { name: 'GLK 280', model_id: 224 },
  { name: 'GLK 300', model_id: 225 },
  { name: 'GLK 320', model_id: 226 },
  { name: 'GLK 350', model_id: 227 },
  // SL-Class
  { name: 'SL', model_id: 230 },
  { name: 'SL 280', model_id: 231 },
  { name: 'SL 300', model_id: 232 },
  { name: 'SL 320', model_id: 233 },
  { name: 'SL 350', model_id: 234 },
  { name: 'SL 380', model_id: 235 },
  { name: 'SL 400', model_id: 236 },
  { name: 'SL 450', model_id: 237 },
  { name: 'SL 500', model_id: 238 },
  { name: 'SL 550', model_id: 239 },
  { name: 'SL 55 AMG', model_id: 240 },
  { name: 'SL 63 AMG', model_id: 241 },
  { name: 'SL 65 AMG', model_id: 242 },
  // SLC/SLK-Class
  { name: 'SLK', model_id: 250 },
  { name: 'SLK 200', model_id: 251 },
  { name: 'SLK 230', model_id: 252 },
  { name: 'SLK 250', model_id: 253 },
  { name: 'SLK 280', model_id: 254 },
  { name: 'SLK 300', model_id: 255 },
  { name: 'SLK 320', model_id: 256 },
  { name: 'SLK 350', model_id: 257 },
  { name: 'SLK 55 AMG', model_id: 258 },
  { name: 'SLC 180', model_id: 259 },
  { name: 'SLC 200', model_id: 260 },
  { name: 'SLC 300', model_id: 261 },
  { name: 'SLC 43 AMG', model_id: 262 },
  // AMG GT
  { name: 'AMG GT', model_id: 270 },
  { name: 'AMG GT S', model_id: 271 },
  { name: 'AMG GT C', model_id: 272 },
  { name: 'AMG GT R', model_id: 273 },
  { name: 'AMG GT 43', model_id: 274 },
  { name: 'AMG GT 53', model_id: 275 },
  { name: 'AMG GT 63', model_id: 276 },
  { name: 'AMG GT 63 S', model_id: 277 },
  // EQ Electric
  { name: 'EQA', model_id: 280 },
  { name: 'EQA 250', model_id: 281 },
  { name: 'EQA 300', model_id: 282 },
  { name: 'EQA 350', model_id: 283 },
  { name: 'EQB', model_id: 284 },
  { name: 'EQB 250', model_id: 285 },
  { name: 'EQB 300', model_id: 286 },
  { name: 'EQB 350', model_id: 287 },
  { name: 'EQC', model_id: 288 },
  { name: 'EQC 400', model_id: 289 },
  { name: 'EQE', model_id: 290 },
  { name: 'EQE 300', model_id: 291 },
  { name: 'EQE 350', model_id: 292 },
  { name: 'EQE 500', model_id: 293 },
  { name: 'EQE 43 AMG', model_id: 294 },
  { name: 'EQE 53 AMG', model_id: 295 },
  { name: 'EQE SUV', model_id: 296 },
  { name: 'EQS', model_id: 297 },
  { name: 'EQS 450', model_id: 298 },
  { name: 'EQS 500', model_id: 299 },
  { name: 'EQS 580', model_id: 300 },
  { name: 'EQS 53 AMG', model_id: 301 },
  { name: 'EQS SUV', model_id: 302 },
  { name: 'EQV', model_id: 303 },
  // Maybach
  { name: 'Maybach S-Class', model_id: 310 },
  { name: 'Maybach S 560', model_id: 311 },
  { name: 'Maybach S 580', model_id: 312 },
  { name: 'Maybach S 600', model_id: 313 },
  { name: 'Maybach S 650', model_id: 314 },
  { name: 'Maybach S 680', model_id: 315 },
  // V-Class / Vito / Viano
  { name: 'V-Class', model_id: 320 },
  { name: 'V 200', model_id: 321 },
  { name: 'V 220', model_id: 322 },
  { name: 'V 250', model_id: 323 },
  { name: 'V 300', model_id: 324 },
  { name: 'Vito', model_id: 325 },
  { name: 'Viano', model_id: 326 },
  // Sprinter
  { name: 'Sprinter', model_id: 330 },
  // Vintage / Classic
  { name: 'W123', model_id: 340 },
  { name: 'W124', model_id: 341 },
  { name: 'W126', model_id: 342 },
  { name: 'W140', model_id: 343 },
  { name: 'W201 (190)', model_id: 344 },
  { name: 'W202', model_id: 345 },
  { name: 'W203', model_id: 346 },
  { name: 'W204', model_id: 347 },
  { name: 'W205', model_id: 348 },
  { name: 'W206', model_id: 349 },
  { name: 'W210', model_id: 350 },
  { name: 'W211', model_id: 351 },
  { name: 'W212', model_id: 352 },
  { name: 'W213', model_id: 353 },
  { name: 'W214', model_id: 354 },
  { name: 'W220', model_id: 355 },
  { name: 'W221', model_id: 356 },
  { name: 'W222', model_id: 357 },
  { name: 'W223', model_id: 358 },
  // R-Class
  { name: 'R-Class', model_id: 360 },
  { name: 'R 280', model_id: 361 },
  { name: 'R 300', model_id: 362 },
  { name: 'R 320', model_id: 363 },
  { name: 'R 350', model_id: 364 },
  { name: 'R 500', model_id: 365 },
  { name: 'R 63 AMG', model_id: 366 },
  // Другие
  { name: 'Другая модель', model_id: 999 },
];

// Все модели BMW
const BMW_MODELS: CarModel[] = [
  // 1 Series
  { name: '1 Series', model_id: 1001 },
  { name: '114i', model_id: 1002 },
  { name: '116i', model_id: 1003 },
  { name: '118i', model_id: 1004 },
  { name: '118d', model_id: 1005 },
  { name: '120i', model_id: 1006 },
  { name: '120d', model_id: 1007 },
  { name: '125i', model_id: 1008 },
  { name: '128ti', model_id: 1009 },
  { name: 'M135i', model_id: 1010 },
  { name: 'M140i', model_id: 1011 },
  // 2 Series
  { name: '2 Series', model_id: 1020 },
  { name: '218i', model_id: 1021 },
  { name: '218d', model_id: 1022 },
  { name: '220i', model_id: 1023 },
  { name: '220d', model_id: 1024 },
  { name: '225i', model_id: 1025 },
  { name: '228i', model_id: 1026 },
  { name: '230i', model_id: 1027 },
  { name: 'M235i', model_id: 1028 },
  { name: 'M240i', model_id: 1029 },
  { name: 'M2', model_id: 1030 },
  { name: 'M2 Competition', model_id: 1031 },
  { name: '2 Series Active Tourer', model_id: 1032 },
  { name: '2 Series Gran Coupe', model_id: 1033 },
  // 3 Series
  { name: '3 Series', model_id: 1040 },
  { name: '316i', model_id: 1041 },
  { name: '318i', model_id: 1042 },
  { name: '318d', model_id: 1043 },
  { name: '320i', model_id: 1044 },
  { name: '320d', model_id: 1045 },
  { name: '323i', model_id: 1046 },
  { name: '325i', model_id: 1047 },
  { name: '325d', model_id: 1048 },
  { name: '328i', model_id: 1049 },
  { name: '330i', model_id: 1050 },
  { name: '330d', model_id: 1051 },
  { name: '330e', model_id: 1052 },
  { name: '335i', model_id: 1053 },
  { name: '335d', model_id: 1054 },
  { name: '340i', model_id: 1055 },
  { name: 'M340i', model_id: 1056 },
  { name: 'M3', model_id: 1057 },
  { name: 'M3 Competition', model_id: 1058 },
  { name: '3 Series GT', model_id: 1059 },
  // 4 Series
  { name: '4 Series', model_id: 1070 },
  { name: '418i', model_id: 1071 },
  { name: '420i', model_id: 1072 },
  { name: '420d', model_id: 1073 },
  { name: '425i', model_id: 1074 },
  { name: '428i', model_id: 1075 },
  { name: '430i', model_id: 1076 },
  { name: '430d', model_id: 1077 },
  { name: '435i', model_id: 1078 },
  { name: '440i', model_id: 1079 },
  { name: 'M440i', model_id: 1080 },
  { name: 'M4', model_id: 1081 },
  { name: 'M4 Competition', model_id: 1082 },
  { name: '4 Series Gran Coupe', model_id: 1083 },
  // 5 Series
  { name: '5 Series', model_id: 1090 },
  { name: '518i', model_id: 1091 },
  { name: '520i', model_id: 1092 },
  { name: '520d', model_id: 1093 },
  { name: '523i', model_id: 1094 },
  { name: '525i', model_id: 1095 },
  { name: '525d', model_id: 1096 },
  { name: '528i', model_id: 1097 },
  { name: '530i', model_id: 1098 },
  { name: '530d', model_id: 1099 },
  { name: '530e', model_id: 1100 },
  { name: '535i', model_id: 1101 },
  { name: '535d', model_id: 1102 },
  { name: '540i', model_id: 1103 },
  { name: '540d', model_id: 1104 },
  { name: '545i', model_id: 1105 },
  { name: '550i', model_id: 1106 },
  { name: 'M550i', model_id: 1107 },
  { name: 'M5', model_id: 1108 },
  { name: 'M5 Competition', model_id: 1109 },
  { name: '5 Series GT', model_id: 1110 },
  // 6 Series
  { name: '6 Series', model_id: 1120 },
  { name: '630i', model_id: 1121 },
  { name: '640i', model_id: 1122 },
  { name: '640d', model_id: 1123 },
  { name: '645i', model_id: 1124 },
  { name: '650i', model_id: 1125 },
  { name: 'M6', model_id: 1126 },
  { name: '6 Series Gran Coupe', model_id: 1127 },
  { name: '6 Series Gran Turismo', model_id: 1128 },
  // 7 Series
  { name: '7 Series', model_id: 1140 },
  { name: '725d', model_id: 1141 },
  { name: '728i', model_id: 1142 },
  { name: '730i', model_id: 1143 },
  { name: '730d', model_id: 1144 },
  { name: '735i', model_id: 1145 },
  { name: '740i', model_id: 1146 },
  { name: '740d', model_id: 1147 },
  { name: '740e', model_id: 1148 },
  { name: '745i', model_id: 1149 },
  { name: '745e', model_id: 1150 },
  { name: '750i', model_id: 1151 },
  { name: '750d', model_id: 1152 },
  { name: '760i', model_id: 1153 },
  { name: 'M760i', model_id: 1154 },
  { name: 'Alpina B7', model_id: 1155 },
  // 8 Series
  { name: '8 Series', model_id: 1160 },
  { name: '840i', model_id: 1161 },
  { name: '840d', model_id: 1162 },
  { name: '850i', model_id: 1163 },
  { name: 'M850i', model_id: 1164 },
  { name: 'M8', model_id: 1165 },
  { name: 'M8 Competition', model_id: 1166 },
  { name: '8 Series Gran Coupe', model_id: 1167 },
  // X1
  { name: 'X1', model_id: 1180 },
  { name: 'X1 sDrive16i', model_id: 1181 },
  { name: 'X1 sDrive18i', model_id: 1182 },
  { name: 'X1 sDrive18d', model_id: 1183 },
  { name: 'X1 sDrive20i', model_id: 1184 },
  { name: 'X1 xDrive20i', model_id: 1185 },
  { name: 'X1 xDrive20d', model_id: 1186 },
  { name: 'X1 xDrive25i', model_id: 1187 },
  { name: 'X1 xDrive25e', model_id: 1188 },
  // X2
  { name: 'X2', model_id: 1190 },
  { name: 'X2 sDrive18i', model_id: 1191 },
  { name: 'X2 sDrive20i', model_id: 1192 },
  { name: 'X2 xDrive20i', model_id: 1193 },
  { name: 'X2 xDrive20d', model_id: 1194 },
  { name: 'X2 M35i', model_id: 1195 },
  // X3
  { name: 'X3', model_id: 1200 },
  { name: 'X3 sDrive18i', model_id: 1201 },
  { name: 'X3 xDrive20i', model_id: 1202 },
  { name: 'X3 xDrive20d', model_id: 1203 },
  { name: 'X3 xDrive25i', model_id: 1204 },
  { name: 'X3 xDrive28i', model_id: 1205 },
  { name: 'X3 xDrive30i', model_id: 1206 },
  { name: 'X3 xDrive30d', model_id: 1207 },
  { name: 'X3 xDrive30e', model_id: 1208 },
  { name: 'X3 xDrive35i', model_id: 1209 },
  { name: 'X3 M40i', model_id: 1210 },
  { name: 'X3 M', model_id: 1211 },
  { name: 'X3 M Competition', model_id: 1212 },
  // X4
  { name: 'X4', model_id: 1220 },
  { name: 'X4 xDrive20i', model_id: 1221 },
  { name: 'X4 xDrive20d', model_id: 1222 },
  { name: 'X4 xDrive28i', model_id: 1223 },
  { name: 'X4 xDrive30i', model_id: 1224 },
  { name: 'X4 xDrive30d', model_id: 1225 },
  { name: 'X4 xDrive35i', model_id: 1226 },
  { name: 'X4 M40i', model_id: 1227 },
  { name: 'X4 M', model_id: 1228 },
  { name: 'X4 M Competition', model_id: 1229 },
  // X5
  { name: 'X5', model_id: 1240 },
  { name: 'X5 sDrive25d', model_id: 1241 },
  { name: 'X5 xDrive25d', model_id: 1242 },
  { name: 'X5 xDrive30i', model_id: 1243 },
  { name: 'X5 xDrive30d', model_id: 1244 },
  { name: 'X5 xDrive35i', model_id: 1245 },
  { name: 'X5 xDrive35d', model_id: 1246 },
  { name: 'X5 xDrive40i', model_id: 1247 },
  { name: 'X5 xDrive40d', model_id: 1248 },
  { name: 'X5 xDrive45e', model_id: 1249 },
  { name: 'X5 xDrive48i', model_id: 1250 },
  { name: 'X5 xDrive50i', model_id: 1251 },
  { name: 'X5 M50i', model_id: 1252 },
  { name: 'X5 M50d', model_id: 1253 },
  { name: 'X5 M', model_id: 1254 },
  { name: 'X5 M Competition', model_id: 1255 },
  // X6
  { name: 'X6', model_id: 1260 },
  { name: 'X6 xDrive30d', model_id: 1261 },
  { name: 'X6 xDrive35i', model_id: 1262 },
  { name: 'X6 xDrive35d', model_id: 1263 },
  { name: 'X6 xDrive40i', model_id: 1264 },
  { name: 'X6 xDrive40d', model_id: 1265 },
  { name: 'X6 xDrive50i', model_id: 1266 },
  { name: 'X6 M50i', model_id: 1267 },
  { name: 'X6 M50d', model_id: 1268 },
  { name: 'X6 M', model_id: 1269 },
  { name: 'X6 M Competition', model_id: 1270 },
  // X7
  { name: 'X7', model_id: 1280 },
  { name: 'X7 xDrive30d', model_id: 1281 },
  { name: 'X7 xDrive40i', model_id: 1282 },
  { name: 'X7 xDrive40d', model_id: 1283 },
  { name: 'X7 xDrive50i', model_id: 1284 },
  { name: 'X7 M50i', model_id: 1285 },
  { name: 'X7 M50d', model_id: 1286 },
  { name: 'X7 M60i', model_id: 1287 },
  // XM
  { name: 'XM', model_id: 1290 },
  { name: 'XM Label Red', model_id: 1291 },
  // Z Series
  { name: 'Z3', model_id: 1300 },
  { name: 'Z3 1.8', model_id: 1301 },
  { name: 'Z3 1.9', model_id: 1302 },
  { name: 'Z3 2.0', model_id: 1303 },
  { name: 'Z3 2.2', model_id: 1304 },
  { name: 'Z3 2.8', model_id: 1305 },
  { name: 'Z3 3.0', model_id: 1306 },
  { name: 'Z3 M Roadster', model_id: 1307 },
  { name: 'Z3 M Coupe', model_id: 1308 },
  { name: 'Z4', model_id: 1310 },
  { name: 'Z4 sDrive20i', model_id: 1311 },
  { name: 'Z4 sDrive28i', model_id: 1312 },
  { name: 'Z4 sDrive30i', model_id: 1313 },
  { name: 'Z4 sDrive35i', model_id: 1314 },
  { name: 'Z4 sDrive35is', model_id: 1315 },
  { name: 'Z4 M40i', model_id: 1316 },
  { name: 'Z8', model_id: 1320 },
  // i Series (Electric)
  { name: 'i3', model_id: 1330 },
  { name: 'i3s', model_id: 1331 },
  { name: 'i4', model_id: 1332 },
  { name: 'i4 eDrive35', model_id: 1333 },
  { name: 'i4 eDrive40', model_id: 1334 },
  { name: 'i4 M50', model_id: 1335 },
  { name: 'i5', model_id: 1336 },
  { name: 'i5 eDrive40', model_id: 1337 },
  { name: 'i5 M60', model_id: 1338 },
  { name: 'i7', model_id: 1340 },
  { name: 'i7 xDrive60', model_id: 1341 },
  { name: 'i7 M70', model_id: 1342 },
  { name: 'i8', model_id: 1345 },
  { name: 'i8 Roadster', model_id: 1346 },
  { name: 'iX', model_id: 1350 },
  { name: 'iX xDrive40', model_id: 1351 },
  { name: 'iX xDrive50', model_id: 1352 },
  { name: 'iX M60', model_id: 1353 },
  { name: 'iX1', model_id: 1355 },
  { name: 'iX1 xDrive30', model_id: 1356 },
  { name: 'iX3', model_id: 1358 },
  // Classic / E-Series
  { name: 'E21 (3 Series)', model_id: 1400 },
  { name: 'E30 (3 Series)', model_id: 1401 },
  { name: 'E36 (3 Series)', model_id: 1402 },
  { name: 'E46 (3 Series)', model_id: 1403 },
  { name: 'E90/E91/E92/E93', model_id: 1404 },
  { name: 'F30/F31 (3 Series)', model_id: 1405 },
  { name: 'G20/G21 (3 Series)', model_id: 1406 },
  { name: 'E34 (5 Series)', model_id: 1410 },
  { name: 'E39 (5 Series)', model_id: 1411 },
  { name: 'E60/E61 (5 Series)', model_id: 1412 },
  { name: 'F10/F11 (5 Series)', model_id: 1413 },
  { name: 'G30/G31 (5 Series)', model_id: 1414 },
  { name: 'E38 (7 Series)', model_id: 1420 },
  { name: 'E65/E66 (7 Series)', model_id: 1421 },
  { name: 'F01/F02 (7 Series)', model_id: 1422 },
  { name: 'G11/G12 (7 Series)', model_id: 1423 },
  { name: 'E53 (X5)', model_id: 1430 },
  { name: 'E70 (X5)', model_id: 1431 },
  { name: 'F15 (X5)', model_id: 1432 },
  { name: 'G05 (X5)', model_id: 1433 },
  // Другие
  { name: 'Другая модель', model_id: 1999 },
];

// Все модели Hyundai
const HYUNDAI_MODELS: CarModel[] = [
  // Accent
  { name: 'Accent', model_id: 2001 },
  { name: 'Accent 1.4', model_id: 2002 },
  { name: 'Accent 1.6', model_id: 2003 },
  // Elantra
  { name: 'Elantra', model_id: 2010 },
  { name: 'Elantra 1.6', model_id: 2011 },
  { name: 'Elantra 1.8', model_id: 2012 },
  { name: 'Elantra 2.0', model_id: 2013 },
  { name: 'Elantra N', model_id: 2014 },
  { name: 'Elantra N Line', model_id: 2015 },
  { name: 'Elantra GT', model_id: 2016 },
  // Sonata
  { name: 'Sonata', model_id: 2020 },
  { name: 'Sonata 2.0', model_id: 2021 },
  { name: 'Sonata 2.4', model_id: 2022 },
  { name: 'Sonata 2.5', model_id: 2023 },
  { name: 'Sonata 2.0T', model_id: 2024 },
  { name: 'Sonata N Line', model_id: 2025 },
  { name: 'Sonata Hybrid', model_id: 2026 },
  { name: 'Sonata Plug-in Hybrid', model_id: 2027 },
  // Azera / Grandeur
  { name: 'Azera', model_id: 2030 },
  { name: 'Grandeur', model_id: 2031 },
  { name: 'Grandeur 2.4', model_id: 2032 },
  { name: 'Grandeur 3.0', model_id: 2033 },
  { name: 'Grandeur 3.3', model_id: 2034 },
  { name: 'Grandeur Hybrid', model_id: 2035 },
  // Genesis (до выделения в отдельный бренд)
  { name: 'Genesis Coupe', model_id: 2040 },
  { name: 'Genesis Coupe 2.0T', model_id: 2041 },
  { name: 'Genesis Coupe 3.8', model_id: 2042 },
  { name: 'Genesis Sedan', model_id: 2043 },
  // i10
  { name: 'i10', model_id: 2050 },
  { name: 'i10 1.0', model_id: 2051 },
  { name: 'i10 1.2', model_id: 2052 },
  { name: 'Grand i10', model_id: 2053 },
  // i20
  { name: 'i20', model_id: 2060 },
  { name: 'i20 1.2', model_id: 2061 },
  { name: 'i20 1.4', model_id: 2062 },
  { name: 'i20 N', model_id: 2063 },
  { name: 'i20 N Line', model_id: 2064 },
  { name: 'i20 Active', model_id: 2065 },
  // i30
  { name: 'i30', model_id: 2070 },
  { name: 'i30 1.4', model_id: 2071 },
  { name: 'i30 1.6', model_id: 2072 },
  { name: 'i30 2.0', model_id: 2073 },
  { name: 'i30 N', model_id: 2074 },
  { name: 'i30 N Line', model_id: 2075 },
  { name: 'i30 Fastback', model_id: 2076 },
  { name: 'i30 Fastback N', model_id: 2077 },
  { name: 'i30 Wagon', model_id: 2078 },
  // i40
  { name: 'i40', model_id: 2080 },
  { name: 'i40 1.7 CRDi', model_id: 2081 },
  { name: 'i40 2.0', model_id: 2082 },
  { name: 'i40 Wagon', model_id: 2083 },
  // Veloster
  { name: 'Veloster', model_id: 2090 },
  { name: 'Veloster 1.6', model_id: 2091 },
  { name: 'Veloster 1.6T', model_id: 2092 },
  { name: 'Veloster N', model_id: 2093 },
  { name: 'Veloster Turbo', model_id: 2094 },
  // Creta / ix25
  { name: 'Creta', model_id: 2100 },
  { name: 'Creta 1.6', model_id: 2101 },
  { name: 'Creta 2.0', model_id: 2102 },
  { name: 'ix25', model_id: 2103 },
  // Venue
  { name: 'Venue', model_id: 2110 },
  { name: 'Venue 1.0T', model_id: 2111 },
  { name: 'Venue 1.6', model_id: 2112 },
  // Kona
  { name: 'Kona', model_id: 2120 },
  { name: 'Kona 1.6', model_id: 2121 },
  { name: 'Kona 1.6T', model_id: 2122 },
  { name: 'Kona 2.0', model_id: 2123 },
  { name: 'Kona N', model_id: 2124 },
  { name: 'Kona N Line', model_id: 2125 },
  { name: 'Kona Electric', model_id: 2126 },
  { name: 'Kona Hybrid', model_id: 2127 },
  // Tucson
  { name: 'Tucson', model_id: 2130 },
  { name: 'Tucson 1.6', model_id: 2131 },
  { name: 'Tucson 1.6T', model_id: 2132 },
  { name: 'Tucson 2.0', model_id: 2133 },
  { name: 'Tucson 2.0 CRDi', model_id: 2134 },
  { name: 'Tucson 2.5', model_id: 2135 },
  { name: 'Tucson N Line', model_id: 2136 },
  { name: 'Tucson Hybrid', model_id: 2137 },
  { name: 'Tucson Plug-in Hybrid', model_id: 2138 },
  // ix35
  { name: 'ix35', model_id: 2140 },
  { name: 'ix35 1.6', model_id: 2141 },
  { name: 'ix35 2.0', model_id: 2142 },
  { name: 'ix35 2.0 CRDi', model_id: 2143 },
  // Santa Fe
  { name: 'Santa Fe', model_id: 2150 },
  { name: 'Santa Fe 2.0T', model_id: 2151 },
  { name: 'Santa Fe 2.2 CRDi', model_id: 2152 },
  { name: 'Santa Fe 2.4', model_id: 2153 },
  { name: 'Santa Fe 2.5', model_id: 2154 },
  { name: 'Santa Fe 2.7', model_id: 2155 },
  { name: 'Santa Fe 3.3', model_id: 2156 },
  { name: 'Santa Fe 3.5', model_id: 2157 },
  { name: 'Santa Fe Hybrid', model_id: 2158 },
  { name: 'Santa Fe Plug-in Hybrid', model_id: 2159 },
  { name: 'Santa Fe XL', model_id: 2160 },
  // Palisade
  { name: 'Palisade', model_id: 2170 },
  { name: 'Palisade 2.2 CRDi', model_id: 2171 },
  { name: 'Palisade 3.5', model_id: 2172 },
  { name: 'Palisade 3.8', model_id: 2173 },
  // Veracruz / ix55
  { name: 'Veracruz', model_id: 2180 },
  { name: 'ix55', model_id: 2181 },
  { name: 'ix55 3.0 CRDi', model_id: 2182 },
  { name: 'ix55 3.8', model_id: 2183 },
  // Terracan
  { name: 'Terracan', model_id: 2190 },
  { name: 'Terracan 2.5', model_id: 2191 },
  { name: 'Terracan 2.9 CRDi', model_id: 2192 },
  { name: 'Terracan 3.5', model_id: 2193 },
  // Galloper
  { name: 'Galloper', model_id: 2200 },
  { name: 'Galloper 2.5', model_id: 2201 },
  { name: 'Galloper 3.0', model_id: 2202 },
  // Starex / H-1 / Grand Starex
  { name: 'Starex', model_id: 2210 },
  { name: 'H-1', model_id: 2211 },
  { name: 'Grand Starex', model_id: 2212 },
  { name: 'H-1 2.4', model_id: 2213 },
  { name: 'H-1 2.5 CRDi', model_id: 2214 },
  // Staria
  { name: 'Staria', model_id: 2220 },
  { name: 'Staria 2.2 CRDi', model_id: 2221 },
  { name: 'Staria 3.5', model_id: 2222 },
  { name: 'Staria Premium', model_id: 2223 },
  { name: 'Staria Lounge', model_id: 2224 },
  // Porter / H100
  { name: 'Porter', model_id: 2230 },
  { name: 'Porter 2', model_id: 2231 },
  { name: 'H100', model_id: 2232 },
  // Ioniq (обычный)
  { name: 'Ioniq', model_id: 2240 },
  { name: 'Ioniq Hybrid', model_id: 2241 },
  { name: 'Ioniq Electric', model_id: 2242 },
  { name: 'Ioniq Plug-in Hybrid', model_id: 2243 },
  // Ioniq (электрический суббренд)
  { name: 'Ioniq 5', model_id: 2250 },
  { name: 'Ioniq 5 Standard Range', model_id: 2251 },
  { name: 'Ioniq 5 Long Range', model_id: 2252 },
  { name: 'Ioniq 5 N', model_id: 2253 },
  { name: 'Ioniq 6', model_id: 2254 },
  { name: 'Ioniq 6 Standard Range', model_id: 2255 },
  { name: 'Ioniq 6 Long Range', model_id: 2256 },
  // Nexo (водородный)
  { name: 'Nexo', model_id: 2260 },
  // Getz
  { name: 'Getz', model_id: 2270 },
  { name: 'Getz 1.1', model_id: 2271 },
  { name: 'Getz 1.3', model_id: 2272 },
  { name: 'Getz 1.4', model_id: 2273 },
  { name: 'Getz 1.5 CRDi', model_id: 2274 },
  { name: 'Getz 1.6', model_id: 2275 },
  // Atos / Santro
  { name: 'Atos', model_id: 2280 },
  { name: 'Atos Prime', model_id: 2281 },
  { name: 'Santro', model_id: 2282 },
  // Solaris (для СНГ)
  { name: 'Solaris', model_id: 2290 },
  { name: 'Solaris 1.4', model_id: 2291 },
  { name: 'Solaris 1.6', model_id: 2292 },
  // Matrix
  { name: 'Matrix', model_id: 2300 },
  { name: 'Matrix 1.5 CRDi', model_id: 2301 },
  { name: 'Matrix 1.6', model_id: 2302 },
  { name: 'Matrix 1.8', model_id: 2303 },
  // Trajet
  { name: 'Trajet', model_id: 2310 },
  { name: 'Trajet 2.0', model_id: 2311 },
  { name: 'Trajet 2.0 CRDi', model_id: 2312 },
  { name: 'Trajet 2.7', model_id: 2313 },
  // Coupe / Tiburon
  { name: 'Coupe', model_id: 2320 },
  { name: 'Tiburon', model_id: 2321 },
  { name: 'Tiburon 1.6', model_id: 2322 },
  { name: 'Tiburon 2.0', model_id: 2323 },
  { name: 'Tiburon 2.7', model_id: 2324 },
  // Lantra / Avante
  { name: 'Lantra', model_id: 2330 },
  { name: 'Avante', model_id: 2331 },
  { name: 'Avante XD', model_id: 2332 },
  { name: 'Avante HD', model_id: 2333 },
  { name: 'Avante MD', model_id: 2334 },
  { name: 'Avante AD', model_id: 2335 },
  { name: 'Avante CN7', model_id: 2336 },
  // Excel / Pony
  { name: 'Excel', model_id: 2340 },
  { name: 'Pony', model_id: 2341 },
  { name: 'Pony Excel', model_id: 2342 },
  // Equus / Centennial
  { name: 'Equus', model_id: 2350 },
  { name: 'Centennial', model_id: 2351 },
  { name: 'Equus 3.8', model_id: 2352 },
  { name: 'Equus 4.6', model_id: 2353 },
  { name: 'Equus 5.0', model_id: 2354 },
  // XG
  { name: 'XG', model_id: 2360 },
  { name: 'XG 25', model_id: 2361 },
  { name: 'XG 30', model_id: 2362 },
  { name: 'XG 350', model_id: 2363 },
  // Dynasty
  { name: 'Dynasty', model_id: 2370 },
  // Bayon
  { name: 'Bayon', model_id: 2380 },
  { name: 'Bayon 1.0T', model_id: 2381 },
  { name: 'Bayon 1.2', model_id: 2382 },
  // Casper
  { name: 'Casper', model_id: 2390 },
  { name: 'Casper 1.0', model_id: 2391 },
  { name: 'Casper 1.0T', model_id: 2392 },
  // Другие
  { name: 'Другая модель', model_id: 2999 },
];

// Все модели Toyota
const TOYOTA_MODELS: CarModel[] = [
  // Camry
  { name: 'Camry', model_id: 3001 },
  { name: 'Camry 2.0', model_id: 3002 },
  { name: 'Camry 2.4', model_id: 3003 },
  { name: 'Camry 2.5', model_id: 3004 },
  { name: 'Camry 3.0', model_id: 3005 },
  { name: 'Camry 3.5', model_id: 3006 },
  { name: 'Camry Hybrid', model_id: 3007 },
  // Corolla
  { name: 'Corolla', model_id: 3010 },
  { name: 'Corolla 1.3', model_id: 3011 },
  { name: 'Corolla 1.6', model_id: 3012 },
  { name: 'Corolla 1.8', model_id: 3013 },
  { name: 'Corolla 2.0', model_id: 3014 },
  { name: 'Corolla Hybrid', model_id: 3015 },
  { name: 'Corolla Cross', model_id: 3016 },
  { name: 'Corolla Cross Hybrid', model_id: 3017 },
  // Avalon
  { name: 'Avalon', model_id: 3020 },
  { name: 'Avalon 2.5', model_id: 3021 },
  { name: 'Avalon 3.5', model_id: 3022 },
  { name: 'Avalon Hybrid', model_id: 3023 },
  // Yaris
  { name: 'Yaris', model_id: 3030 },
  { name: 'Yaris 1.0', model_id: 3031 },
  { name: 'Yaris 1.3', model_id: 3032 },
  { name: 'Yaris 1.5', model_id: 3033 },
  { name: 'Yaris Hybrid', model_id: 3034 },
  { name: 'Yaris Cross', model_id: 3035 },
  { name: 'Yaris GR', model_id: 3036 },
  // Auris
  { name: 'Auris', model_id: 3040 },
  { name: 'Auris 1.4', model_id: 3041 },
  { name: 'Auris 1.6', model_id: 3042 },
  { name: 'Auris 1.8', model_id: 3043 },
  { name: 'Auris Hybrid', model_id: 3044 },
  // Avensis
  { name: 'Avensis', model_id: 3050 },
  { name: 'Avensis 1.6', model_id: 3051 },
  { name: 'Avensis 1.8', model_id: 3052 },
  { name: 'Avensis 2.0', model_id: 3053 },
  { name: 'Avensis 2.4', model_id: 3054 },
  // Prius
  { name: 'Prius', model_id: 3060 },
  { name: 'Prius 1.5', model_id: 3061 },
  { name: 'Prius 1.8', model_id: 3062 },
  { name: 'Prius 2.0', model_id: 3063 },
  { name: 'Prius Plus', model_id: 3064 },
  { name: 'Prius Prime', model_id: 3065 },
  { name: 'Prius C', model_id: 3066 },
  { name: 'Prius V', model_id: 3067 },
  // RAV4
  { name: 'RAV4', model_id: 3070 },
  { name: 'RAV4 2.0', model_id: 3071 },
  { name: 'RAV4 2.2', model_id: 3072 },
  { name: 'RAV4 2.4', model_id: 3073 },
  { name: 'RAV4 2.5', model_id: 3074 },
  { name: 'RAV4 Hybrid', model_id: 3075 },
  { name: 'RAV4 Prime', model_id: 3076 },
  // Highlander
  { name: 'Highlander', model_id: 3080 },
  { name: 'Highlander 2.7', model_id: 3081 },
  { name: 'Highlander 3.0', model_id: 3082 },
  { name: 'Highlander 3.5', model_id: 3083 },
  { name: 'Highlander Hybrid', model_id: 3084 },
  // Land Cruiser
  { name: 'Land Cruiser', model_id: 3090 },
  { name: 'Land Cruiser 100', model_id: 3091 },
  { name: 'Land Cruiser 200', model_id: 3092 },
  { name: 'Land Cruiser 300', model_id: 3093 },
  { name: 'Land Cruiser 4.0', model_id: 3094 },
  { name: 'Land Cruiser 4.5', model_id: 3095 },
  { name: 'Land Cruiser 4.6', model_id: 3096 },
  { name: 'Land Cruiser 4.7', model_id: 3097 },
  { name: 'Land Cruiser 5.7', model_id: 3098 },
  { name: 'Land Cruiser Prado', model_id: 3099 },
  { name: 'Land Cruiser Prado 2.7', model_id: 3100 },
  { name: 'Land Cruiser Prado 3.0', model_id: 3101 },
  { name: 'Land Cruiser Prado 4.0', model_id: 3102 },
  // C-HR
  { name: 'C-HR', model_id: 3110 },
  { name: 'C-HR 1.2T', model_id: 3111 },
  { name: 'C-HR 1.8 Hybrid', model_id: 3112 },
  { name: 'C-HR 2.0 Hybrid', model_id: 3113 },
  // 4Runner
  { name: '4Runner', model_id: 3120 },
  { name: '4Runner 2.7', model_id: 3121 },
  { name: '4Runner 4.0', model_id: 3122 },
  { name: '4Runner 4.7', model_id: 3123 },
  // Sequoia
  { name: 'Sequoia', model_id: 3130 },
  { name: 'Sequoia 4.7', model_id: 3131 },
  { name: 'Sequoia 5.7', model_id: 3132 },
  // Fortuner
  { name: 'Fortuner', model_id: 3140 },
  { name: 'Fortuner 2.4', model_id: 3141 },
  { name: 'Fortuner 2.7', model_id: 3142 },
  { name: 'Fortuner 2.8', model_id: 3143 },
  { name: 'Fortuner 4.0', model_id: 3144 },
  // Venza
  { name: 'Venza', model_id: 3150 },
  { name: 'Venza 2.7', model_id: 3151 },
  { name: 'Venza 3.5', model_id: 3152 },
  { name: 'Venza Hybrid', model_id: 3153 },
  // Sienna
  { name: 'Sienna', model_id: 3160 },
  { name: 'Sienna 2.7', model_id: 3161 },
  { name: 'Sienna 3.3', model_id: 3162 },
  { name: 'Sienna 3.5', model_id: 3163 },
  { name: 'Sienna Hybrid', model_id: 3164 },
  // Alphard
  { name: 'Alphard', model_id: 3170 },
  { name: 'Alphard 2.4', model_id: 3171 },
  { name: 'Alphard 2.5', model_id: 3172 },
  { name: 'Alphard 3.0', model_id: 3173 },
  { name: 'Alphard 3.5', model_id: 3174 },
  { name: 'Alphard Hybrid', model_id: 3175 },
  // Supra
  { name: 'Supra', model_id: 3180 },
  { name: 'Supra 2.0', model_id: 3181 },
  { name: 'Supra 3.0', model_id: 3182 },
  { name: 'Supra GR', model_id: 3183 },
  // 86 / GT86
  { name: '86', model_id: 3190 },
  { name: 'GT86', model_id: 3191 },
  { name: 'GR86', model_id: 3192 },
  // Celica
  { name: 'Celica', model_id: 3200 },
  { name: 'Celica 1.8', model_id: 3201 },
  { name: 'Celica 2.0', model_id: 3202 },
  // MR2
  { name: 'MR2', model_id: 3210 },
  // Tundra
  { name: 'Tundra', model_id: 3220 },
  { name: 'Tundra 4.6', model_id: 3221 },
  { name: 'Tundra 4.7', model_id: 3222 },
  { name: 'Tundra 5.7', model_id: 3223 },
  // Tacoma
  { name: 'Tacoma', model_id: 3230 },
  { name: 'Tacoma 2.7', model_id: 3231 },
  { name: 'Tacoma 3.5', model_id: 3232 },
  { name: 'Tacoma 4.0', model_id: 3233 },
  // Hilux
  { name: 'Hilux', model_id: 3240 },
  { name: 'Hilux 2.4', model_id: 3241 },
  { name: 'Hilux 2.5', model_id: 3242 },
  { name: 'Hilux 2.7', model_id: 3243 },
  { name: 'Hilux 2.8', model_id: 3244 },
  { name: 'Hilux 3.0', model_id: 3245 },
  { name: 'Hilux 4.0', model_id: 3246 },
  // Hiace
  { name: 'Hiace', model_id: 3250 },
  { name: 'Hiace 2.0', model_id: 3251 },
  { name: 'Hiace 2.5', model_id: 3252 },
  { name: 'Hiace 2.7', model_id: 3253 },
  { name: 'Hiace 3.0', model_id: 3254 },
  // Crown
  { name: 'Crown', model_id: 3260 },
  { name: 'Crown 2.0', model_id: 3261 },
  { name: 'Crown 2.5', model_id: 3262 },
  { name: 'Crown 3.0', model_id: 3263 },
  { name: 'Crown 3.5', model_id: 3264 },
  { name: 'Crown Hybrid', model_id: 3265 },
  // bZ4X
  { name: 'bZ4X', model_id: 3270 },
  // Другие
  { name: 'Другая модель', model_id: 3999 },
];

// Все модели Audi
const AUDI_MODELS: CarModel[] = [
  // A1
  { name: 'A1', model_id: 4001 },
  { name: 'A1 1.0 TFSI', model_id: 4002 },
  { name: 'A1 1.4 TFSI', model_id: 4003 },
  { name: 'A1 1.5 TFSI', model_id: 4004 },
  { name: 'A1 Sportback', model_id: 4005 },
  { name: 'S1', model_id: 4006 },
  // A3
  { name: 'A3', model_id: 4010 },
  { name: 'A3 1.4 TFSI', model_id: 4011 },
  { name: 'A3 1.5 TFSI', model_id: 4012 },
  { name: 'A3 1.8 TFSI', model_id: 4013 },
  { name: 'A3 2.0 TFSI', model_id: 4014 },
  { name: 'A3 2.0 TDI', model_id: 4015 },
  { name: 'A3 Sportback', model_id: 4016 },
  { name: 'A3 Sedan', model_id: 4017 },
  { name: 'A3 Cabriolet', model_id: 4018 },
  { name: 'A3 e-tron', model_id: 4019 },
  { name: 'S3', model_id: 4020 },
  { name: 'RS3', model_id: 4021 },
  // A4
  { name: 'A4', model_id: 4030 },
  { name: 'A4 1.8 TFSI', model_id: 4031 },
  { name: 'A4 2.0 TFSI', model_id: 4032 },
  { name: 'A4 2.0 TDI', model_id: 4033 },
  { name: 'A4 3.0 TDI', model_id: 4034 },
  { name: 'A4 3.0 TFSI', model_id: 4035 },
  { name: 'A4 Avant', model_id: 4036 },
  { name: 'A4 Allroad', model_id: 4037 },
  { name: 'S4', model_id: 4038 },
  { name: 'RS4', model_id: 4039 },
  // A5
  { name: 'A5', model_id: 4040 },
  { name: 'A5 2.0 TFSI', model_id: 4041 },
  { name: 'A5 2.0 TDI', model_id: 4042 },
  { name: 'A5 3.0 TDI', model_id: 4043 },
  { name: 'A5 Sportback', model_id: 4044 },
  { name: 'A5 Cabriolet', model_id: 4045 },
  { name: 'S5', model_id: 4046 },
  { name: 'RS5', model_id: 4047 },
  // A6
  { name: 'A6', model_id: 4050 },
  { name: 'A6 2.0 TFSI', model_id: 4051 },
  { name: 'A6 2.0 TDI', model_id: 4052 },
  { name: 'A6 2.8 FSI', model_id: 4053 },
  { name: 'A6 3.0 TDI', model_id: 4054 },
  { name: 'A6 3.0 TFSI', model_id: 4055 },
  { name: 'A6 4.0 TFSI', model_id: 4056 },
  { name: 'A6 Avant', model_id: 4057 },
  { name: 'A6 Allroad', model_id: 4058 },
  { name: 'S6', model_id: 4059 },
  { name: 'RS6', model_id: 4060 },
  { name: 'RS6 Avant', model_id: 4061 },
  // A7
  { name: 'A7', model_id: 4070 },
  { name: 'A7 2.0 TFSI', model_id: 4071 },
  { name: 'A7 3.0 TDI', model_id: 4072 },
  { name: 'A7 3.0 TFSI', model_id: 4073 },
  { name: 'A7 Sportback', model_id: 4074 },
  { name: 'S7', model_id: 4075 },
  { name: 'RS7', model_id: 4076 },
  // A8
  { name: 'A8', model_id: 4080 },
  { name: 'A8 3.0 TDI', model_id: 4081 },
  { name: 'A8 3.0 TFSI', model_id: 4082 },
  { name: 'A8 4.0 TFSI', model_id: 4083 },
  { name: 'A8 4.2 TDI', model_id: 4084 },
  { name: 'A8 4.2 FSI', model_id: 4085 },
  { name: 'A8 6.0 W12', model_id: 4086 },
  { name: 'A8 L', model_id: 4087 },
  { name: 'S8', model_id: 4088 },
  // Q2
  { name: 'Q2', model_id: 4090 },
  { name: 'Q2 1.0 TFSI', model_id: 4091 },
  { name: 'Q2 1.4 TFSI', model_id: 4092 },
  { name: 'Q2 2.0 TFSI', model_id: 4093 },
  { name: 'Q2 2.0 TDI', model_id: 4094 },
  { name: 'SQ2', model_id: 4095 },
  // Q3
  { name: 'Q3', model_id: 4100 },
  { name: 'Q3 1.4 TFSI', model_id: 4101 },
  { name: 'Q3 2.0 TFSI', model_id: 4102 },
  { name: 'Q3 2.0 TDI', model_id: 4103 },
  { name: 'Q3 Sportback', model_id: 4104 },
  { name: 'RSQ3', model_id: 4105 },
  // Q5
  { name: 'Q5', model_id: 4110 },
  { name: 'Q5 2.0 TFSI', model_id: 4111 },
  { name: 'Q5 2.0 TDI', model_id: 4112 },
  { name: 'Q5 3.0 TDI', model_id: 4113 },
  { name: 'Q5 3.0 TFSI', model_id: 4114 },
  { name: 'Q5 Sportback', model_id: 4115 },
  { name: 'Q5 e-tron', model_id: 4116 },
  { name: 'SQ5', model_id: 4117 },
  // Q7
  { name: 'Q7', model_id: 4120 },
  { name: 'Q7 2.0 TFSI', model_id: 4121 },
  { name: 'Q7 3.0 TDI', model_id: 4122 },
  { name: 'Q7 3.0 TFSI', model_id: 4123 },
  { name: 'Q7 4.0 TDI', model_id: 4124 },
  { name: 'Q7 4.2 TDI', model_id: 4125 },
  { name: 'Q7 4.2 FSI', model_id: 4126 },
  { name: 'Q7 e-tron', model_id: 4127 },
  { name: 'SQ7', model_id: 4128 },
  // Q8
  { name: 'Q8', model_id: 4130 },
  { name: 'Q8 3.0 TDI', model_id: 4131 },
  { name: 'Q8 3.0 TFSI', model_id: 4132 },
  { name: 'SQ8', model_id: 4133 },
  { name: 'RSQ8', model_id: 4134 },
  // e-tron
  { name: 'e-tron', model_id: 4140 },
  { name: 'e-tron 50', model_id: 4141 },
  { name: 'e-tron 55', model_id: 4142 },
  { name: 'e-tron S', model_id: 4143 },
  { name: 'e-tron Sportback', model_id: 4144 },
  { name: 'e-tron GT', model_id: 4145 },
  { name: 'RS e-tron GT', model_id: 4146 },
  { name: 'Q4 e-tron', model_id: 4147 },
  { name: 'Q8 e-tron', model_id: 4148 },
  // TT
  { name: 'TT', model_id: 4150 },
  { name: 'TT 1.8 TFSI', model_id: 4151 },
  { name: 'TT 2.0 TFSI', model_id: 4152 },
  { name: 'TT 2.0 TDI', model_id: 4153 },
  { name: 'TT Roadster', model_id: 4154 },
  { name: 'TTS', model_id: 4155 },
  { name: 'TT RS', model_id: 4156 },
  // R8
  { name: 'R8', model_id: 4160 },
  { name: 'R8 4.2 FSI', model_id: 4161 },
  { name: 'R8 5.2 FSI', model_id: 4162 },
  { name: 'R8 Spyder', model_id: 4163 },
  // Другие
  { name: 'Другая модель', model_id: 4999 },
];

// Все модели Volkswagen
const VW_MODELS: CarModel[] = [
  // Polo
  { name: 'Polo', model_id: 5001 },
  { name: 'Polo 1.0', model_id: 5002 },
  { name: 'Polo 1.0 TSI', model_id: 5003 },
  { name: 'Polo 1.2', model_id: 5004 },
  { name: 'Polo 1.4', model_id: 5005 },
  { name: 'Polo 1.4 TSI', model_id: 5006 },
  { name: 'Polo 1.6', model_id: 5007 },
  { name: 'Polo GTI', model_id: 5008 },
  { name: 'Polo R WRC', model_id: 5009 },
  // Golf
  { name: 'Golf', model_id: 5010 },
  { name: 'Golf 1.0 TSI', model_id: 5011 },
  { name: 'Golf 1.2 TSI', model_id: 5012 },
  { name: 'Golf 1.4 TSI', model_id: 5013 },
  { name: 'Golf 1.5 TSI', model_id: 5014 },
  { name: 'Golf 1.6', model_id: 5015 },
  { name: 'Golf 1.6 TDI', model_id: 5016 },
  { name: 'Golf 2.0 TDI', model_id: 5017 },
  { name: 'Golf 2.0 TSI', model_id: 5018 },
  { name: 'Golf Variant', model_id: 5019 },
  { name: 'Golf Plus', model_id: 5020 },
  { name: 'Golf GTI', model_id: 5021 },
  { name: 'Golf GTD', model_id: 5022 },
  { name: 'Golf GTE', model_id: 5023 },
  { name: 'Golf R', model_id: 5024 },
  { name: 'e-Golf', model_id: 5025 },
  // Jetta
  { name: 'Jetta', model_id: 5030 },
  { name: 'Jetta 1.4 TSI', model_id: 5031 },
  { name: 'Jetta 1.6', model_id: 5032 },
  { name: 'Jetta 1.8 TSI', model_id: 5033 },
  { name: 'Jetta 2.0', model_id: 5034 },
  { name: 'Jetta 2.0 TDI', model_id: 5035 },
  { name: 'Jetta GLI', model_id: 5036 },
  // Passat
  { name: 'Passat', model_id: 5040 },
  { name: 'Passat 1.4 TSI', model_id: 5041 },
  { name: 'Passat 1.8 TSI', model_id: 5042 },
  { name: 'Passat 2.0 TDI', model_id: 5043 },
  { name: 'Passat 2.0 TSI', model_id: 5044 },
  { name: 'Passat 3.6 FSI', model_id: 5045 },
  { name: 'Passat Variant', model_id: 5046 },
  { name: 'Passat Alltrack', model_id: 5047 },
  { name: 'Passat CC', model_id: 5048 },
  { name: 'Passat GTE', model_id: 5049 },
  // Arteon
  { name: 'Arteon', model_id: 5050 },
  { name: 'Arteon 2.0 TDI', model_id: 5051 },
  { name: 'Arteon 2.0 TSI', model_id: 5052 },
  { name: 'Arteon Shooting Brake', model_id: 5053 },
  { name: 'Arteon R', model_id: 5054 },
  // Tiguan
  { name: 'Tiguan', model_id: 5060 },
  { name: 'Tiguan 1.4 TSI', model_id: 5061 },
  { name: 'Tiguan 2.0 TDI', model_id: 5062 },
  { name: 'Tiguan 2.0 TSI', model_id: 5063 },
  { name: 'Tiguan Allspace', model_id: 5064 },
  { name: 'Tiguan R', model_id: 5065 },
  { name: 'Tiguan eHybrid', model_id: 5066 },
  // T-Roc
  { name: 'T-Roc', model_id: 5070 },
  { name: 'T-Roc 1.0 TSI', model_id: 5071 },
  { name: 'T-Roc 1.5 TSI', model_id: 5072 },
  { name: 'T-Roc 2.0 TDI', model_id: 5073 },
  { name: 'T-Roc 2.0 TSI', model_id: 5074 },
  { name: 'T-Roc Cabriolet', model_id: 5075 },
  { name: 'T-Roc R', model_id: 5076 },
  // T-Cross
  { name: 'T-Cross', model_id: 5080 },
  { name: 'T-Cross 1.0 TSI', model_id: 5081 },
  { name: 'T-Cross 1.5 TSI', model_id: 5082 },
  // Taos
  { name: 'Taos', model_id: 5085 },
  // Touareg
  { name: 'Touareg', model_id: 5090 },
  { name: 'Touareg 2.5 TDI', model_id: 5091 },
  { name: 'Touareg 3.0 TDI', model_id: 5092 },
  { name: 'Touareg 3.0 TSI', model_id: 5093 },
  { name: 'Touareg 3.6 FSI', model_id: 5094 },
  { name: 'Touareg 4.0 TDI', model_id: 5095 },
  { name: 'Touareg 4.2 TDI', model_id: 5096 },
  { name: 'Touareg R', model_id: 5097 },
  { name: 'Touareg eHybrid', model_id: 5098 },
  // Atlas
  { name: 'Atlas', model_id: 5100 },
  { name: 'Atlas 2.0 TSI', model_id: 5101 },
  { name: 'Atlas 3.6 FSI', model_id: 5102 },
  { name: 'Atlas Cross Sport', model_id: 5103 },
  // Touran
  { name: 'Touran', model_id: 5110 },
  { name: 'Touran 1.2 TSI', model_id: 5111 },
  { name: 'Touran 1.4 TSI', model_id: 5112 },
  { name: 'Touran 1.6 TDI', model_id: 5113 },
  { name: 'Touran 2.0 TDI', model_id: 5114 },
  // Sharan
  { name: 'Sharan', model_id: 5120 },
  { name: 'Sharan 1.4 TSI', model_id: 5121 },
  { name: 'Sharan 2.0 TDI', model_id: 5122 },
  // Multivan / Transporter
  { name: 'Multivan', model_id: 5130 },
  { name: 'Multivan T5', model_id: 5131 },
  { name: 'Multivan T6', model_id: 5132 },
  { name: 'Multivan T6.1', model_id: 5133 },
  { name: 'Multivan T7', model_id: 5134 },
  { name: 'Transporter', model_id: 5135 },
  { name: 'Caravelle', model_id: 5136 },
  { name: 'California', model_id: 5137 },
  // ID (Electric)
  { name: 'ID.3', model_id: 5140 },
  { name: 'ID.3 Pro', model_id: 5141 },
  { name: 'ID.3 Pro S', model_id: 5142 },
  { name: 'ID.4', model_id: 5143 },
  { name: 'ID.4 Pro', model_id: 5144 },
  { name: 'ID.4 GTX', model_id: 5145 },
  { name: 'ID.5', model_id: 5146 },
  { name: 'ID.5 GTX', model_id: 5147 },
  { name: 'ID.6', model_id: 5148 },
  { name: 'ID.7', model_id: 5149 },
  { name: 'ID. Buzz', model_id: 5150 },
  // Up!
  { name: 'Up!', model_id: 5160 },
  { name: 'e-Up!', model_id: 5161 },
  { name: 'Up! GTI', model_id: 5162 },
  // Beetle
  { name: 'Beetle', model_id: 5170 },
  { name: 'New Beetle', model_id: 5171 },
  { name: 'Beetle 1.2 TSI', model_id: 5172 },
  { name: 'Beetle 1.4 TSI', model_id: 5173 },
  { name: 'Beetle 2.0 TDI', model_id: 5174 },
  { name: 'Beetle 2.0 TSI', model_id: 5175 },
  { name: 'Beetle Cabriolet', model_id: 5176 },
  // Scirocco
  { name: 'Scirocco', model_id: 5180 },
  { name: 'Scirocco 1.4 TSI', model_id: 5181 },
  { name: 'Scirocco 2.0 TDI', model_id: 5182 },
  { name: 'Scirocco 2.0 TSI', model_id: 5183 },
  { name: 'Scirocco R', model_id: 5184 },
  // Amarok
  { name: 'Amarok', model_id: 5190 },
  { name: 'Amarok 2.0 TDI', model_id: 5191 },
  { name: 'Amarok 3.0 TDI', model_id: 5192 },
  // Phaeton
  { name: 'Phaeton', model_id: 5200 },
  { name: 'Phaeton 3.0 TDI', model_id: 5201 },
  { name: 'Phaeton 4.2 FSI', model_id: 5202 },
  { name: 'Phaeton 6.0 W12', model_id: 5203 },
  // Caddy
  { name: 'Caddy', model_id: 5210 },
  { name: 'Caddy 1.4', model_id: 5211 },
  { name: 'Caddy 1.6 TDI', model_id: 5212 },
  { name: 'Caddy 2.0 TDI', model_id: 5213 },
  { name: 'Caddy Maxi', model_id: 5214 },
  // Crafter
  { name: 'Crafter', model_id: 5220 },
  { name: 'Crafter 2.0 TDI', model_id: 5221 },
  // Другие
  { name: 'Другая модель', model_id: 5999 },
];

// Все модели Kia
const KIA_MODELS: CarModel[] = [
  // Rio
  { name: 'Rio', model_id: 6001 },
  { name: 'Rio 1.2', model_id: 6002 },
  { name: 'Rio 1.4', model_id: 6003 },
  { name: 'Rio 1.6', model_id: 6004 },
  { name: 'Rio X-Line', model_id: 6005 },
  // Ceed
  { name: 'Ceed', model_id: 6010 },
  { name: 'Ceed 1.0 T-GDI', model_id: 6011 },
  { name: 'Ceed 1.4', model_id: 6012 },
  { name: 'Ceed 1.5 T-GDI', model_id: 6013 },
  { name: 'Ceed 1.6', model_id: 6014 },
  { name: 'Ceed 1.6 CRDi', model_id: 6015 },
  { name: 'Ceed 2.0', model_id: 6016 },
  { name: 'Ceed SW', model_id: 6017 },
  { name: 'Ceed GT', model_id: 6018 },
  { name: 'Ceed GT Line', model_id: 6019 },
  { name: 'ProCeed', model_id: 6020 },
  { name: 'ProCeed GT', model_id: 6021 },
  { name: 'XCeed', model_id: 6022 },
  // Cerato / Forte
  { name: 'Cerato', model_id: 6030 },
  { name: 'Cerato 1.6', model_id: 6031 },
  { name: 'Cerato 2.0', model_id: 6032 },
  { name: 'Cerato Koup', model_id: 6033 },
  { name: 'Forte', model_id: 6034 },
  { name: 'Forte GT', model_id: 6035 },
  // K5 / Optima
  { name: 'K5', model_id: 6040 },
  { name: 'K5 2.0', model_id: 6041 },
  { name: 'K5 2.5', model_id: 6042 },
  { name: 'K5 GT', model_id: 6043 },
  { name: 'K5 Hybrid', model_id: 6044 },
  { name: 'Optima', model_id: 6045 },
  { name: 'Optima 2.0', model_id: 6046 },
  { name: 'Optima 2.4', model_id: 6047 },
  { name: 'Optima Hybrid', model_id: 6048 },
  // K8 / Cadenza
  { name: 'K8', model_id: 6050 },
  { name: 'K8 2.5', model_id: 6051 },
  { name: 'K8 3.5', model_id: 6052 },
  { name: 'K8 Hybrid', model_id: 6053 },
  { name: 'Cadenza', model_id: 6054 },
  // K9 / Quoris
  { name: 'K9', model_id: 6060 },
  { name: 'K9 3.3', model_id: 6061 },
  { name: 'K9 3.8', model_id: 6062 },
  { name: 'K9 5.0', model_id: 6063 },
  { name: 'Quoris', model_id: 6064 },
  // Stinger
  { name: 'Stinger', model_id: 6070 },
  { name: 'Stinger 2.0 T-GDI', model_id: 6071 },
  { name: 'Stinger 2.2 CRDi', model_id: 6072 },
  { name: 'Stinger 3.3 T-GDI', model_id: 6073 },
  { name: 'Stinger GT', model_id: 6074 },
  // Picanto / Morning
  { name: 'Picanto', model_id: 6080 },
  { name: 'Picanto 1.0', model_id: 6081 },
  { name: 'Picanto 1.2', model_id: 6082 },
  { name: 'Picanto GT-Line', model_id: 6083 },
  { name: 'Morning', model_id: 6084 },
  // Soul
  { name: 'Soul', model_id: 6090 },
  { name: 'Soul 1.6', model_id: 6091 },
  { name: 'Soul 2.0', model_id: 6092 },
  { name: 'Soul EV', model_id: 6093 },
  // Seltos
  { name: 'Seltos', model_id: 6100 },
  { name: 'Seltos 1.6', model_id: 6101 },
  { name: 'Seltos 1.6 T-GDI', model_id: 6102 },
  { name: 'Seltos 2.0', model_id: 6103 },
  // Sportage
  { name: 'Sportage', model_id: 6110 },
  { name: 'Sportage 1.6', model_id: 6111 },
  { name: 'Sportage 1.6 T-GDI', model_id: 6112 },
  { name: 'Sportage 2.0', model_id: 6113 },
  { name: 'Sportage 2.0 CRDi', model_id: 6114 },
  { name: 'Sportage 2.4', model_id: 6115 },
  { name: 'Sportage Hybrid', model_id: 6116 },
  { name: 'Sportage PHEV', model_id: 6117 },
  { name: 'Sportage GT-Line', model_id: 6118 },
  // Sorento
  { name: 'Sorento', model_id: 6120 },
  { name: 'Sorento 2.2 CRDi', model_id: 6121 },
  { name: 'Sorento 2.4', model_id: 6122 },
  { name: 'Sorento 2.5', model_id: 6123 },
  { name: 'Sorento 3.3', model_id: 6124 },
  { name: 'Sorento 3.5', model_id: 6125 },
  { name: 'Sorento Hybrid', model_id: 6126 },
  { name: 'Sorento PHEV', model_id: 6127 },
  // Mohave / Borrego
  { name: 'Mohave', model_id: 6130 },
  { name: 'Mohave 3.0 CRDi', model_id: 6131 },
  { name: 'Mohave 3.8', model_id: 6132 },
  { name: 'Borrego', model_id: 6133 },
  // Telluride
  { name: 'Telluride', model_id: 6140 },
  { name: 'Telluride 3.8', model_id: 6141 },
  // Carnival / Sedona
  { name: 'Carnival', model_id: 6150 },
  { name: 'Carnival 2.2 CRDi', model_id: 6151 },
  { name: 'Carnival 2.9 CRDi', model_id: 6152 },
  { name: 'Carnival 3.3', model_id: 6153 },
  { name: 'Carnival 3.5', model_id: 6154 },
  { name: 'Sedona', model_id: 6155 },
  // Niro
  { name: 'Niro', model_id: 6160 },
  { name: 'Niro Hybrid', model_id: 6161 },
  { name: 'Niro PHEV', model_id: 6162 },
  { name: 'Niro EV', model_id: 6163 },
  // EV6
  { name: 'EV6', model_id: 6170 },
  { name: 'EV6 Standard', model_id: 6171 },
  { name: 'EV6 Long Range', model_id: 6172 },
  { name: 'EV6 GT', model_id: 6173 },
  { name: 'EV6 GT-Line', model_id: 6174 },
  // EV9
  { name: 'EV9', model_id: 6180 },
  { name: 'EV9 Standard', model_id: 6181 },
  { name: 'EV9 Long Range', model_id: 6182 },
  { name: 'EV9 GT-Line', model_id: 6183 },
  // Bongo
  { name: 'Bongo', model_id: 6190 },
  { name: 'Bongo 2.5', model_id: 6191 },
  { name: 'Bongo 2.7', model_id: 6192 },
  // Spectra
  { name: 'Spectra', model_id: 6200 },
  // Magentis
  { name: 'Magentis', model_id: 6210 },
  { name: 'Magentis 2.0', model_id: 6211 },
  { name: 'Magentis 2.4', model_id: 6212 },
  { name: 'Magentis 2.7', model_id: 6213 },
  // Opirus / Amanti
  { name: 'Opirus', model_id: 6220 },
  { name: 'Amanti', model_id: 6221 },
  // Carens / Rondo
  { name: 'Carens', model_id: 6230 },
  { name: 'Carens 1.6', model_id: 6231 },
  { name: 'Carens 2.0', model_id: 6232 },
  { name: 'Rondo', model_id: 6233 },
  // Venga
  { name: 'Venga', model_id: 6240 },
  { name: 'Venga 1.4', model_id: 6241 },
  { name: 'Venga 1.6', model_id: 6242 },
  // Другие
  { name: 'Другая модель', model_id: 6999 },
];

// Объединённые данные марок и моделей
const ALL_BRANDS: Brand[] = [
  { name: 'Mercedes-Benz', make_id: 449 },
  { name: 'BMW', make_id: 452 },
  { name: 'Audi', make_id: 453 },
  { name: 'Volkswagen', make_id: 454 },
  { name: 'Toyota', make_id: 455 },
  { name: 'Hyundai', make_id: 200 },
  { name: 'Kia', make_id: 456 },
];

const MODELS_BY_BRAND: { [key: number]: CarModel[] } = {
  449: MERCEDES_MODELS, // Mercedes-Benz
  452: BMW_MODELS,      // BMW
  453: AUDI_MODELS,     // Audi
  454: VW_MODELS,       // Volkswagen
  455: TOYOTA_MODELS,   // Toyota
  200: HYUNDAI_MODELS,  // Hyundai
  456: KIA_MODELS,      // Kia
};

export default function AddCarDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [bodyTypeModalVisible, setBodyTypeModalVisible] = useState(false);
  const [engineVolumeModalVisible, setEngineVolumeModalVisible] = useState(false);
  const [featuresModalVisible, setFeaturesModalVisible] = useState(false);
  const [brandModalVisible, setBrandModalVisible] = useState(false);

  // Brands and Models state
  const [brands] = useState<Brand[]>(ALL_BRANDS);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [models, setModels] = useState<CarModel[]>([]);
  const [brandsLoading] = useState(false);
  const [modelsLoading] = useState(false);

  const categories = [
    { value: 'cars', label: 'Автомобили', icon: '🚗' },
    { value: 'electric', label: 'Электромобили', icon: '⚡' },
    { value: 'motorcycles', label: 'Мотоциклы', icon: '🏍️' },
    { value: 'trucks', label: 'Грузовики', icon: '🚚' },
    { value: 'parts', label: 'Запчасти', icon: '🔧' },
    { value: 'rent', label: 'Аренда авто', icon: '🔑' },
  ];

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    price: '',
    mileage: '',
    engineType: 'petrol',
    engineVolume: null as number | null,
    bodyType: '',
    transmission: 'automatic',
    driveType: 'rear',
    condition: 'used',
    color: '',
    region: 'dushanbe',
    category: 'cars',
    description: '',
    features: [] as string[],
  });

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setFormData(prev => ({ ...prev, brand: brand.name, model: '' }));
    setModels(MODELS_BY_BRAND[brand.make_id] || []);
    setBrandModalVisible(false);
  };

  const handleModelSelect = (option: { label: string; value: string | number }) => {
    const model = models.find(m => m.name === option.label);
    if (model) {
      setSelectedModel(model);
      setFormData(prev => ({ ...prev, model: model.name }));
    }
  };

  const brandOptions = brands.map(b => ({
    label: b.name,
    value: b.make_id.toString(),
    id: b.make_id,
  }));

  const modelOptions = models.map(m => ({
    label: m.name,
    value: m.model_id?.toString() || m.name,
    id: m.model_id,
  }));

  const toggleFeature = (featureValue: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureValue)
        ? prev.features.filter(f => f !== featureValue)
        : [...prev.features, featureValue]
    }));
  };

  const pickImage = async () => {
    if (photos.length >= 10) {
      Alert.alert(t('messages.error'), 'Максимум 10 фотографий');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('messages.error'), 'Нужно разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const takePhoto = async () => {
    if (photos.length >= 10) {
      Alert.alert(t('messages.error'), 'Максимум 10 фотографий');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('messages.error'), 'Нужно разрешение на доступ к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.brand || !formData.model) {
      Alert.alert(t('messages.error'), 'Заполните марку и модель');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert(t('messages.error'), 'Укажите корректную цену');
      return false;
    }
    if (!formData.mileage || parseInt(formData.mileage) < 0) {
      Alert.alert(t('messages.error'), 'Укажите корректный пробег');
      return false;
    }
    if (photos.length === 0) {
      Alert.alert(t('messages.error'), 'Добавьте хотя бы одну фотографию');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const carData = {
        ...formData,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        mileage: parseInt(formData.mileage),
        photos,
        sellerPhone: user.phone,
        sellerId: user._id || user.phone,
        status: 'pending' as const,
      };

      await carAPI.create(carData as any);
      Alert.alert(
        t('messages.success'),
        'Объявление отправлено на модерацию',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert(t('messages.error'), 'Не удалось создать объявление');
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ title, required = false }: { title: string; required?: boolean }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {required && <Text style={styles.requiredBadge}>Обязательно</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/home')} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новое объявление</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Section */}
        <View style={styles.card}>
          <SectionHeader title="📷 Фотографии" required />
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 10 && (
              <>
                <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={28} color="#0066FF" />
                  <Text style={styles.addPhotoText}>Камера</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Ionicons name="images" size={28} color="#0066FF" />
                  <Text style={styles.addPhotoText}>Галерея</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.photoProgress}>
            <View style={[styles.photoProgressBar, { width: `${(photos.length / 10) * 100}%` }]} />
          </View>
          <Text style={styles.photoCount}>{photos.length}/10 фото</Text>
        </View>

        {/* Category */}
        <View style={styles.card}>
          <SectionHeader title="📁 Категория" required />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setCategoryModalVisible(true)}
          >
            <View style={styles.selectFieldContent}>
              <Text style={styles.selectFieldIcon}>
                {categories.find(c => c.value === formData.category)?.icon}
              </Text>
              <Text style={styles.selectFieldText}>
                {categories.find(c => c.value === formData.category)?.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Brand & Model */}
        <View style={styles.card}>
          <SectionHeader title="🚗 Марка и модель" required />
          
          {/* Brand Selection */}
          <Text style={styles.fieldLabel}>Марка</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setBrandModalVisible(true)}
          >
            {selectedBrand ? (
              <View style={styles.brandSelectedRow}>
                <Image 
                  source={{ uri: selectedBrand.name === 'Mercedes-Benz' 
                    ? 'https://www.carlogos.org/car-logos/mercedes-benz-logo-2011-1920x1080.png'
                    : selectedBrand.name === 'BMW'
                    ? 'https://www.carlogos.org/car-logos/bmw-logo-2020-grey.png'
                    : 'https://www.carlogos.org/car-logos/hyundai-logo-2011-1920x1080.png'
                  }} 
                  style={styles.brandSelectLogo}
                  resizeMode="contain"
                />
                <Text style={styles.selectFieldText}>{selectedBrand.name}</Text>
              </View>
            ) : (
              <Text style={[styles.selectFieldText, styles.placeholder]}>
                Выберите марку
              </Text>
            )}
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
          
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Модель</Text>
          <SearchableSelect
            title={selectedBrand ? `Модели ${selectedBrand.name}` : "Выберите модель"}
            placeholder="Выберите модель"
            value={formData.model}
            options={modelOptions}
            onSelect={handleModelSelect}
            loading={modelsLoading}
            disabled={!selectedBrand}
            disabledPlaceholder="Сначала выберите марку"
            emptyText="Модели не найдены"
          />
        </View>

        {/* Main Specs */}
        <View style={styles.card}>
          <SectionHeader title="📊 Основные характеристики" required />
          
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Год выпуска</Text>
              <TextInput
                style={styles.input}
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                keyboardType="numeric"
                placeholder="2020"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Пробег (км)</Text>
              <TextInput
                style={styles.input}
                value={formData.mileage}
                onChangeText={(text) => setFormData({ ...formData, mileage: text })}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Цена (TJS)</Text>
          <View style={styles.priceInputContainer}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
              placeholder="85,000"
              placeholderTextColor="#94A3B8"
            />
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>TJS</Text>
            </View>
          </View>
        </View>

        {/* Technical Specs */}
        <View style={styles.card}>
          <SectionHeader title="⚙️ Технические данные" />
          
          {/* Body Type */}
          <Text style={styles.fieldLabel}>Тип кузова</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setBodyTypeModalVisible(true)}
          >
            <Text style={[styles.selectFieldText, !formData.bodyType && styles.placeholder]}>
              {formData.bodyType ? BODY_TYPES.find(b => b.value === formData.bodyType)?.label : 'Выберите тип кузова'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Engine Type */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Тип двигателя</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'petrol', label: 'Бензин', icon: '⛽' },
              { value: 'diesel', label: 'Дизель', icon: '🛢️' },
              { value: 'electric', label: 'Электро', icon: '⚡' },
              { value: 'hybrid', label: 'Гибрид', icon: '🔋' },
            ].map(type => (
              <TouchableOpacity
                key={type.value}
                style={[styles.chip, formData.engineType === type.value && styles.chipActive]}
                onPress={() => setFormData({ ...formData, engineType: type.value })}
              >
                <Text style={styles.chipIcon}>{type.icon}</Text>
                <Text style={[styles.chipText, formData.engineType === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Engine Volume */}
          {formData.engineType !== 'electric' && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Объём двигателя</Text>
              <TouchableOpacity
                style={styles.selectField}
                onPress={() => setEngineVolumeModalVisible(true)}
              >
                <Text style={[styles.selectFieldText, !formData.engineVolume && styles.placeholder]}>
                  {formData.engineVolume ? `${formData.engineVolume} л` : 'Выберите объём'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </>
          )}

          {/* Transmission */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>КПП</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, formData.transmission === 'manual' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, transmission: 'manual' })}
            >
              <Text style={[styles.toggleText, formData.transmission === 'manual' && styles.toggleTextActive]}>
                Механика
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, formData.transmission === 'automatic' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, transmission: 'automatic' })}
            >
              <Text style={[styles.toggleText, formData.transmission === 'automatic' && styles.toggleTextActive]}>
                Автомат
              </Text>
            </TouchableOpacity>
          </View>

          {/* Drive Type */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Привод</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'front', label: 'Передний' },
              { value: 'rear', label: 'Задний' },
              { value: 'awd', label: 'Полный' },
            ].map(type => (
              <TouchableOpacity
                key={type.value}
                style={[styles.chip, styles.chipSmall, formData.driveType === type.value && styles.chipActive]}
                onPress={() => setFormData({ ...formData, driveType: type.value })}
              >
                <Text style={[styles.chipText, formData.driveType === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Condition & Color */}
        <View style={styles.card}>
          <SectionHeader title="🎨 Состояние и цвет" />
          
          <Text style={styles.fieldLabel}>Состояние</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, formData.condition === 'new' && styles.toggleActiveGreen]}
              onPress={() => setFormData({ ...formData, condition: 'new' })}
            >
              <Text style={[styles.toggleText, formData.condition === 'new' && styles.toggleTextActive]}>
                ✨ Новый
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, formData.condition === 'used' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, condition: 'used' })}
            >
              <Text style={[styles.toggleText, formData.condition === 'used' && styles.toggleTextActive]}>
                С пробегом
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Цвет</Text>
          <TextInput
            style={styles.input}
            value={formData.color}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            placeholder="Например: Белый, Чёрный металлик"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Features */}
        <View style={styles.card}>
          <SectionHeader title="✅ Опции и комплектация" />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setFeaturesModalVisible(true)}
          >
            <Text style={[styles.selectFieldText, formData.features.length === 0 && styles.placeholder]}>
              {formData.features.length > 0 
                ? `Выбрано: ${formData.features.length} опций`
                : 'Выберите опции автомобиля'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
          
          {formData.features.length > 0 && (
            <View style={styles.selectedFeatures}>
              {formData.features.slice(0, 5).map(f => (
                <View key={f} style={styles.featureTag}>
                  <Text style={styles.featureTagText}>
                    {CAR_FEATURES.find(cf => cf.value === f)?.label}
                  </Text>
                </View>
              ))}
              {formData.features.length > 5 && (
                <View style={styles.featureTag}>
                  <Text style={styles.featureTagText}>+{formData.features.length - 5}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.card}>
          <SectionHeader title="📍 Регион" required />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setRegionModalVisible(true)}
          >
            <Ionicons name="location" size={20} color="#0066FF" />
            <Text style={styles.selectFieldText}>
              {t(`regions.${formData.region}`)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <SectionHeader title="📝 Описание" />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Расскажите о состоянии автомобиля, истории обслуживания, причине продажи..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.submitText}>Опубликовать объявление</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Объявление будет проверено модератором перед публикацией
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      {/* Brand Modal */}
      <Modal visible={brandModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите марку</Text>
              <TouchableOpacity onPress={() => setBrandModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={brands}
              keyExtractor={(item) => item.make_id.toString()}
              renderItem={({ item }) => {
                const logoUrl = item.name === 'Mercedes-Benz' 
                  ? 'https://www.carlogos.org/car-logos/mercedes-benz-logo-2011-1920x1080.png'
                  : item.name === 'BMW'
                  ? 'https://www.carlogos.org/car-logos/bmw-logo-2020-grey.png'
                  : 'https://www.carlogos.org/car-logos/hyundai-logo-2011-1920x1080.png';
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, styles.brandModalItem]}
                    onPress={() => handleBrandSelect(item)}
                  >
                    <Image 
                      source={{ uri: logoUrl }} 
                      style={styles.brandModalLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.brandModalText}>{item.name}</Text>
                    {selectedBrand?.make_id === item.make_id && (
                      <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите категорию</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, category: item.value });
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemIcon}>{item.icon}</Text>
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.category === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Body Type Modal */}
      <Modal visible={bodyTypeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Тип кузова</Text>
              <TouchableOpacity onPress={() => setBodyTypeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={BODY_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, bodyType: item.value });
                    setBodyTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.bodyType === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Engine Volume Modal */}
      <Modal visible={engineVolumeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Объём двигателя</Text>
              <TouchableOpacity onPress={() => setEngineVolumeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ENGINE_VOLUMES}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, engineVolume: item.value });
                    setEngineVolumeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.engineVolume === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Region Modal */}
      <Modal visible={regionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите регион</Text>
              <TouchableOpacity onPress={() => setRegionModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={REGIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, region: item.value });
                    setRegionModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{t(item.label)}</Text>
                  {formData.region === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Features Modal */}
      <Modal visible={featuresModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Опции ({formData.features.length})</Text>
              <TouchableOpacity onPress={() => setFeaturesModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CAR_FEATURES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, formData.features.includes(item.value) && styles.modalItemSelected]}
                  onPress={() => toggleFeature(item.value)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  <View style={[styles.checkbox, formData.features.includes(item.value) && styles.checkboxActive]}>
                    {formData.features.includes(item.value) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setFeaturesModalVisible(false)}
              >
                <Text style={styles.modalDoneText}>Готово</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  brandHeaderLogo: {
    width: 48,
    height: 48,
  },
  brandHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  brandSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  brandSelectLogo: {
    width: 32,
    height: 32,
  },
  brandModalItem: {
    paddingVertical: 20,
  },
  brandModalLogo: {
    width: 48,
    height: 48,
  },
  brandModalText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  currencyBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  currencyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  selectField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  selectFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectFieldIcon: {
    fontSize: 24,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  placeholder: {
    color: '#94A3B8',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSmall: {
    flex: 1,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#E8F1FF',
    borderColor: '#0066FF',
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#0066FF',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#0066FF',
  },
  toggleActiveGreen: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  selectedFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  featureTag: {
    backgroundColor: '#E8F1FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  featureTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 90,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
  },
  photoProgress: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  photoProgressBar: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  photoCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  modalItemSelected: {
    backgroundColor: '#F8FAFC',
  },
  modalItemIcon: {
    fontSize: 24,
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalDoneButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
