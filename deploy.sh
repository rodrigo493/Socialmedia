#!/usr/bin/env bash
# Deploy do Social Media na VPS (Docker Swarm + Traefik).
#
# Uso (na VPS, em /opt/social-src):
#   ./deploy.sh                 # git pull + build + update
#   ./deploy.sh --no-cache      # build limpo, sem cache de camadas
#   ./deploy.sh --skip-pull     # pula git pull (se já fez)
#   ./deploy.sh --no-build      # só roda update (imagem já buildada)
#
# Pré-requisitos:
#   - Estar dentro de /opt/social-src (clone do repo)
#   - /opt/social/secrets/{.env,gcp-service-account.json} já configurados
#   - Stack inicial já deployado: docker stack deploy -c docker-stack.yml social

set -euo pipefail

NO_CACHE=""
SKIP_PULL=0
NO_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --no-cache)  NO_CACHE="--no-cache" ;;
    --skip-pull) SKIP_PULL=1 ;;
    --no-build)  NO_BUILD=1 ;;
    *) echo "Flag desconhecida: $arg"; exit 1 ;;
  esac
done

if [[ $SKIP_PULL -eq 0 ]]; then
  echo "==> git pull origin master"
  git pull origin master
  git log --oneline -1
fi

if [[ $NO_BUILD -eq 0 ]]; then
  echo "==> docker build $NO_CACHE -t social:latest ."
  docker build $NO_CACHE -t social:latest .
fi

echo "==> docker service update --image social:latest --force social_social"
docker service update --image social:latest --force social_social

echo "==> docker service ps social_social"
docker service ps social_social --no-trunc | head -5

echo
echo "Deploy concluido. Logs: docker service logs --tail 50 -f social_social"
