# Build context is backend-dotnet/ (the solution root), NOT this directory.
# See docker-compose.yml, which sets `context: .` and `dockerfile: src/FunctionWars.Api/Dockerfile`.
#
# Targets:
#   dev    - SDK image running `dotnet watch`, used by docker compose. Source is bind-mounted
#            at runtime, so nothing here is baked in; the COPY steps exist only to warm the
#            NuGet cache so container start doesn't re-download packages.
#   final  - runtime-only image for deployment (not wired into CI yet).

ARG DOTNET_VERSION=10.0


# ---------------------------------------------------------------------------
# restore: csproj files only, so editing C# doesn't invalidate the restore layer
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS restore
WORKDIR /src

COPY Directory.Build.props ./
COPY FunctionWars.slnx ./
COPY src/FunctionWars.Domain/FunctionWars.Domain.csproj                 src/FunctionWars.Domain/
COPY src/FunctionWars.Infrastructure/FunctionWars.Infrastructure.csproj src/FunctionWars.Infrastructure/
COPY src/FunctionWars.Api/FunctionWars.Api.csproj                       src/FunctionWars.Api/
COPY tests/FunctionWars.Domain.Tests/FunctionWars.Domain.Tests.csproj   tests/FunctionWars.Domain.Tests/
COPY tests/FunctionWars.Api.Tests/FunctionWars.Api.Tests.csproj         tests/FunctionWars.Api.Tests/

RUN dotnet restore FunctionWars.slnx


# ---------------------------------------------------------------------------
# dev: what `docker compose up` runs
# ---------------------------------------------------------------------------
FROM restore AS dev

# Run as the host user so files the container writes into the bind mount
# (obj/, bin/) stay owned by you and don't need sudo to remove.
ARG UID=1000
ARG GID=1000

# NuGet packages live outside the bind mount, in a named volume, so they survive
# rebuilds and are not clobbered when the host source is mounted over /src.
ENV NUGET_PACKAGES=/nuget \
    DOTNET_CLI_HOME=/tmp \
    DOTNET_NOLOGO=1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    ASPNETCORE_ENVIRONMENT=Development

# Seed the cache into its final location and hand both paths to the host user.
# A named volume mounted at /nuget inherits this ownership on first creation.
RUN mkdir -p /nuget \
    && cp -r /root/.nuget/packages/. /nuget/ 2>/dev/null || true \
    && chown -R ${UID}:${GID} /nuget /src

USER ${UID}:${GID}
WORKDIR /src
EXPOSE 8080

# --no-launch-profile: ignore Properties/launchSettings.json so the port comes from
# ASPNETCORE_URLS in compose rather than from a file meant for IDE launches.
CMD ["dotnet", "watch", "--project", "src/FunctionWars.Api", "run", "--no-launch-profile"]


# ---------------------------------------------------------------------------
# build + final: deployment image. Not used by compose; here so the path exists.
# ---------------------------------------------------------------------------
FROM restore AS build
COPY . .
RUN dotnet publish src/FunctionWars.Api/FunctionWars.Api.csproj \
        -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "FunctionWars.Api.dll"]
