#!/bin/bash

# ============================================================================
# GitHub Status Monitor & Auto-Deploy Script
# Monitors GitHub Actions status and triggers deployment when resolved
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHECK_INTERVAL=60  # Check every 60 seconds
MAX_CHECKS=120     # Maximum 2 hours (120 checks)
GITHUB_STATUS_API="https://www.githubstatus.com/api/v2/status.json"
GITHUB_COMPONENTS_API="https://www.githubstatus.com/api/v2/components.json"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Log file
LOG_FILE="$PROJECT_DIR/github-status-monitor.log"

# ============================================================================
# Functions
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Check if GitHub Actions is operational
check_github_status() {
    local status_response=$(curl -s "$GITHUB_STATUS_API")
    local overall_status=$(echo "$status_response" | grep -o '"indicator":"[^"]*"' | cut -d'"' -f4)
    
    # Check components for Actions specifically
    local components_response=$(curl -s "$GITHUB_COMPONENTS_API")
    local actions_status=$(echo "$components_response" | grep -A 5 '"name":"Actions"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 | head -1)
    
    echo "$overall_status|$actions_status"
}

# Check if workflows are triggering
check_workflows_triggering() {
    cd "$PROJECT_DIR"
    
    # Get latest workflow run
    local latest_run=$(gh run list --limit 1 --json createdAt,conclusion,status 2>/dev/null)
    
    if [ -z "$latest_run" ]; then
        return 1
    fi
    
    # Check if there's a recent run (within last 5 minutes)
    local created_at=$(echo "$latest_run" | grep -o '"createdAt":"[^"]*"' | cut -d'"' -f4)
    local run_time=$(date -d "$created_at" +%s 2>/dev/null || echo "0")
    local current_time=$(date +%s)
    local time_diff=$((current_time - run_time))
    
    if [ $time_diff -lt 300 ]; then
        return 0  # Recent run found
    else
        return 1  # No recent runs
    fi
}

# Trigger deployment
trigger_deployment() {
    cd "$PROJECT_DIR"
    
    log "Triggering deployment..."
    
    # Create empty commit to trigger workflow
    git commit --allow-empty -m "chore: Auto-trigger deployment after GitHub incident resolution" 2>&1 | tee -a "$LOG_FILE"
    
    # Push to trigger workflow
    if git push origin main 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Deployment triggered successfully!"
        return 0
    else
        log_error "Failed to push commit"
        return 1
    fi
}

# Monitor workflow progress
monitor_workflow() {
    cd "$PROJECT_DIR"
    
    log "Monitoring workflow progress..."
    
    # Wait for workflow to start
    sleep 10
    
    # Get latest run ID
    local run_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
    
    if [ -z "$run_id" ]; then
        log_warning "No workflow run found yet"
        return 1
    fi
    
    log "Workflow run ID: $run_id"
    log "View at: https://github.com/brunowachira001-coder/smart-pos-system/actions/runs/$run_id"
    
    # Watch the workflow
    gh run watch "$run_id" 2>&1 | tee -a "$LOG_FILE"
    
    # Check final status
    local status=$(gh run view "$run_id" --json conclusion --jq '.conclusion')
    
    if [ "$status" = "success" ]; then
        log_success "Deployment completed successfully! 🎉"
        return 0
    else
        log_error "Deployment failed with status: $status"
        return 1
    fi
}

# Send desktop notification (if available)
send_notification() {
    local title="$1"
    local message="$2"
    
    if command -v notify-send &> /dev/null; then
        notify-send "$title" "$message"
    fi
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    log "=========================================="
    log "GitHub Status Monitor Started"
    log "=========================================="
    log "Project: Smart POS System"
    log "Check interval: ${CHECK_INTERVAL}s"
    log "Max duration: $((MAX_CHECKS * CHECK_INTERVAL / 60)) minutes"
    log "Log file: $LOG_FILE"
    log ""
    
    local check_count=0
    local incident_detected=false
    
    while [ $check_count -lt $MAX_CHECKS ]; do
        check_count=$((check_count + 1))
        
        log "Check #$check_count/$MAX_CHECKS"
        
        # Check GitHub status
        local status_result=$(check_github_status)
        local overall_status=$(echo "$status_result" | cut -d'|' -f1)
        local actions_status=$(echo "$status_result" | cut -d'|' -f2)
        
        log "GitHub Status: $overall_status"
        log "Actions Status: $actions_status"
        
        # Check if there's an incident
        if [ "$overall_status" != "none" ] || [ "$actions_status" != "operational" ]; then
            incident_detected=true
            log_warning "GitHub incident detected - waiting for resolution..."
        else
            # Status is good
            if [ "$incident_detected" = true ]; then
                log_success "GitHub incident resolved!"
                send_notification "GitHub Incident Resolved" "Triggering deployment now..."
                
                # Trigger deployment
                if trigger_deployment; then
                    log_success "Deployment triggered successfully!"
                    
                    # Monitor the workflow
                    if monitor_workflow; then
                        log_success "=========================================="
                        log_success "DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
                        log_success "=========================================="
                        send_notification "Deployment Complete" "Smart POS System is now live!"
                        exit 0
                    else
                        log_error "Deployment failed - check logs"
                        send_notification "Deployment Failed" "Check logs for details"
                        exit 1
                    fi
                else
                    log_error "Failed to trigger deployment"
                    exit 1
                fi
            else
                log_success "GitHub is operational - checking if workflows are triggering..."
                
                # Check if workflows are already triggering
                if check_workflows_triggering; then
                    log_success "Workflows are triggering! Monitoring latest run..."
                    
                    if monitor_workflow; then
                        log_success "=========================================="
                        log_success "DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
                        log_success "=========================================="
                        send_notification "Deployment Complete" "Smart POS System is now live!"
                        exit 0
                    else
                        log_error "Deployment failed - check logs"
                        exit 1
                    fi
                else
                    log "No recent workflow runs detected - will trigger deployment"
                    
                    if trigger_deployment; then
                        if monitor_workflow; then
                            log_success "=========================================="
                            log_success "DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
                            log_success "=========================================="
                            send_notification "Deployment Complete" "Smart POS System is now live!"
                            exit 0
                        fi
                    fi
                fi
            fi
        fi
        
        # Wait before next check
        if [ $check_count -lt $MAX_CHECKS ]; then
            log "Waiting ${CHECK_INTERVAL}s before next check..."
            log ""
            sleep $CHECK_INTERVAL
        fi
    done
    
    log_warning "=========================================="
    log_warning "Maximum monitoring time reached"
    log_warning "=========================================="
    log_warning "GitHub incident may still be ongoing"
    log_warning "You can:"
    log_warning "1. Run this script again to continue monitoring"
    log_warning "2. Check https://www.githubstatus.com/ manually"
    log_warning "3. Trigger deployment manually when ready"
    
    exit 2
}

# ============================================================================
# Run Script
# ============================================================================

# Check dependencies
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) is not installed"
    log_error "Install it from: https://cli.github.com/"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    log_error "curl is not installed"
    exit 1
fi

# Run main function
main
